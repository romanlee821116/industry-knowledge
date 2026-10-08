'use client';

import { CameraControls, Environment, Html, Lightformer, RoundedBox } from '@react-three/drei';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/shared/lib/cn';

import { PALETTE } from '../data/micro-views';
import type { LayerBlock, LayerInstances, StackLayout } from '../types';
import { SceneModel } from './SceneModel';

export interface StackLabel {
  id: string;
  name: string;
  position: [number, number, number];
}

export interface FocusBox {
  center: [number, number, number];
  size: [number, number, number];
}

interface Props {
  layout: StackLayout;
  /** 非空時，只有其中的層正常顯示，其餘淡出 */
  highlighted: Set<string>;
  selectedId: string | null;
  hoveredId: string | null;
  /** 剖面：保留 x < clipX 的部分；null 表示不剖 */
  clipX: number | null;
  labels: StackLabel[];
  focus: FocusBox | null;
  focusKey: number;
  /** 組裝狀態下會擋住內部結構、暫時不可點擊的層（例如蓋板） */
  passiveIds: string[];
  /** 目前爆炸程度（整廠模型依此抬升可拆零件） */
  explode: number;
  /** 未選取任何東西時的鏡頭位置與注視點 */
  home: { position: [number, number, number]; target: [number, number, number] };
  onSelectLayer: (id: string) => void;
  onHoverLayer: (id: string | null) => void;
}

interface LookProps {
  layerId: string;
  palette: string;
  opacity?: number;
  highlighted: Set<string>;
  selectedId: string | null;
  hoveredId: string | null;
  clipPlanes: THREE.Plane[];
}

const METALLIC = new Set(['copper', 'solder', 'gold', 'probe', 'chuck']);

function LayerMaterial({ layerId, palette, opacity, highlighted, selectedId, hoveredId, clipPlanes }: LookProps) {
  const dimmed = highlighted.size > 0 && !highlighted.has(layerId);
  const active = selectedId === layerId || hoveredId === layerId;
  const finalOpacity = dimmed ? 0.08 : (opacity ?? 1);
  return (
    <meshStandardMaterial
      color={PALETTE[palette as keyof typeof PALETTE]}
      emissive={active ? '#ffd166' : '#000000'}
      emissiveIntensity={active ? 0.35 : 0}
      metalness={METALLIC.has(palette) ? 0.85 : 0.08}
      roughness={METALLIC.has(palette) ? 0.3 : 0.5}
      transparent={finalOpacity < 1}
      opacity={finalOpacity}
      depthWrite={finalOpacity >= 1}
      clippingPlanes={clipPlanes}
      side={THREE.DoubleSide}
    />
  );
}

type Handlers = Pick<Props, 'onSelectLayer' | 'onHoverLayer' | 'clipX'> & {
  /** 不可點擊的層（淡出中、或組裝狀態下的蓋板） */
  passive: Set<string>;
};

const noRaycast = () => null;

function pointerHandlers(layerId: string, { onSelectLayer, onHoverLayer, clipX, passive }: Handlers) {
  if (passive.has(layerId)) return { raycast: noRaycast };
  // Raycaster 不理會剖面平面：被剖掉的那一半不應攔截事件，讓事件繼續傳給後方物件
  const clipped = (e: ThreeEvent<PointerEvent | MouseEvent>) => clipX !== null && e.point.x > clipX + 1e-3;
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (clipped(e)) return;
      e.stopPropagation();
      onSelectLayer(layerId);
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (clipped(e)) return;
      e.stopPropagation();
      onHoverLayer(layerId);
    },
    onPointerOut: () => onHoverLayer(null),
  };
}

function Block({
  block,
  look,
  handlers,
}: {
  block: LayerBlock;
  look: Omit<LookProps, 'layerId' | 'palette' | 'opacity'>;
  handlers: Handlers;
}) {
  const material = <LayerMaterial layerId={block.layerId} palette={block.palette} opacity={block.opacity} {...look} />;
  const events = pointerHandlers(block.layerId, handlers);
  if (block.shape === 'cylinder') {
    return (
      <mesh position={block.position} castShadow receiveShadow {...events}>
        <cylinderGeometry args={[block.size[0] / 2, block.size[0] / 2, block.size[1], 64]} />
        {material}
      </mesh>
    );
  }
  // 圓角邊緣：半徑不超過最薄邊的 1/4，薄層仍維持銳利
  const radius = Math.min(0.06, Math.min(...block.size) / 4);
  return (
    <RoundedBox
      args={block.size}
      radius={radius}
      smoothness={3}
      position={block.position}
      castShadow
      receiveShadow
      {...events}
    >
      {material}
    </RoundedBox>
  );
}

function Instanced({
  inst,
  look,
  handlers,
}: {
  inst: LayerInstances;
  look: Omit<LookProps, 'layerId' | 'palette' | 'opacity'>;
  handlers: Handlers;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const scale =
      inst.shape === 'sphere' ? new THREE.Vector3(1, inst.height / (2 * inst.radius), 1) : new THREE.Vector3(1, 1, 1);
    inst.positions.forEach((p, i) => {
      m.compose(new THREE.Vector3(...p), new THREE.Quaternion(), scale);
      ref.current?.setMatrixAt(i, m);
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, [inst]);
  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[undefined, undefined, inst.positions.length]}
      {...pointerHandlers(inst.layerId, handlers)}
    >
      {inst.shape === 'sphere' ? (
        <sphereGeometry args={[inst.radius, 12, 8]} />
      ) : (
        <cylinderGeometry args={[inst.radius, inst.radius, inst.height, 10]} />
      )}
      <LayerMaterial layerId={inst.layerId} palette={inst.palette} {...look} />
    </instancedMesh>
  );
}

/** 聚焦時至少維持的俯角，避免 fitToBox 轉成正面平視而失去立體感 */
const MIN_ELEVATION = THREE.MathUtils.degToRad(28);

function CameraRig({ focus, focusKey, home }: Pick<Props, 'focus' | 'focusKey' | 'home'>) {
  const ref = useRef<CameraControls>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    if (!focus) {
      const [p, t] = [home.position, home.target];
      controls.setLookAt(p[0], p[1], p[2], t[0], t[1], t[2], true);
      return;
    }
    const target = new THREE.Vector3(...focus.center);
    const radius = Math.max(new THREE.Vector3(...focus.size).length() / 2, 2.5);
    const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.35;
    // 沿用目前的水平方位角，俯角至少 MIN_ELEVATION
    const dir = camera.position.clone().sub(controls.getTarget(new THREE.Vector3())).normalize();
    const azimuth = Math.atan2(dir.x, dir.z);
    const elevation = Math.max(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)), MIN_ELEVATION);
    const offset = new THREE.Vector3(
      Math.cos(elevation) * Math.sin(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.cos(azimuth),
    ).multiplyScalar(distance);
    const pos = target.clone().add(offset);
    controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在聚焦目標變更時移動鏡頭
  }, [focusKey]);
  return <CameraControls ref={ref} makeDefault minDistance={2} maxDistance={80} />;
}

export function StackCanvas({
  layout,
  highlighted,
  selectedId,
  hoveredId,
  clipX,
  labels,
  focus,
  focusKey,
  passiveIds,
  explode,
  home,
  onSelectLayer,
  onHoverLayer,
}: Props) {
  const clipPlanes = useMemo(
    () => (clipX === null ? [] : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipX)]),
    [clipX],
  );
  const look = { highlighted, selectedId, hoveredId, clipPlanes };
  const passive = useMemo(() => {
    const ids = new Set<string>();
    const all = [...layout.blocks, ...layout.instances].map((b) => b.layerId);
    if (highlighted.size > 0) all.filter((id) => !highlighted.has(id)).forEach((id) => ids.add(id));
    passiveIds.forEach((id) => ids.add(id));
    return ids;
  }, [layout, highlighted, passiveIds]);
  const handlers = { onSelectLayer, onHoverLayer, clipX, passive };

  return (
    <Canvas
      shadows
      camera={{ position: [26, 16, 26], fov: 35 }}
      gl={{ localClippingEnabled: true, antialias: false }}
      onPointerMissed={() => onHoverLayer(null)}
    >
      <color attach="background" args={['#0f1720']} />
      <hemisphereLight args={['#ffffff', '#334155', 0.35]} />
      <directionalLight
        position={[14, 26, 12]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
      />
      {/* 無塵室式的柔和頂光與側光，提供金屬與玻璃反射（程式產生，不需下載 HDR） */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={0.7} rotation-x={Math.PI / 2} position={[0, 14, 0]} scale={[40, 40, 1]} />
        <Lightformer intensity={0.35} rotation-y={Math.PI / 2} position={[-25, 5, 0]} scale={[40, 8, 1]} />
        <Lightformer intensity={0.35} rotation-y={-Math.PI / 2} position={[25, 5, 0]} scale={[40, 8, 1]} />
        <Lightformer intensity={0.25} position={[0, 5, 25]} scale={[40, 8, 1]} />
      </Environment>
      {layout.model && (
        <Suspense fallback={null}>
          <SceneModel
            url={layout.model.url}
            explode={explode}
            highlighted={highlighted}
            selectedId={selectedId}
            hoveredId={hoveredId}
            clipPlanes={clipPlanes}
            clipX={clipX}
            passive={passive}
            onSelectLayer={onSelectLayer}
            onHoverLayer={onHoverLayer}
          />
        </Suspense>
      )}
      {layout.blocks.map((b) => (
        <Block key={b.key} block={b} look={look} handlers={handlers} />
      ))}
      {layout.instances.map((inst) => (
        <Instanced key={inst.key} inst={inst} look={look} handlers={handlers} />
      ))}
      {labels.map((l) => (
        <Html key={l.id} position={l.position} center={false} zIndexRange={[10, 0]}>
          <button
            type="button"
            onClick={() => onSelectLayer(l.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-200',
              (selectedId === l.id || hoveredId === l.id) && 'text-amber-300',
            )}
          >
            <span className="h-px w-8 bg-current opacity-70" />
            <span className="rounded bg-slate-900/80 px-1.5 py-0.5">{l.name}</span>
          </button>
        </Html>
      ))}
      {!layout.model && (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[120, 120]} />
            <shadowMaterial opacity={0.35} />
          </mesh>
          <gridHelper args={[60, 30, '#1e293b', '#1e293b']} position={[0, -0.01, 0]} />
        </>
      )}
      <CameraRig focus={focus} focusKey={focusKey} home={home} />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={1.2} intensity={2.2} distanceFalloff={1} halfRes />
      </EffectComposer>
    </Canvas>
  );
}
