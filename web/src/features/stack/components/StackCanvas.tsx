'use client';

import { CameraControls, Html } from '@react-three/drei';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { cn } from '@/shared/lib/cn';

import { PALETTE } from '../data/micro-views';
import type { LayerBlock, LayerInstances, StackLayout } from '../types';

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
  /** 組裝狀態下蓋板會擋住晶片，此時讓它不可點擊 */
  lidPassive: boolean;
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

function LayerMaterial({ layerId, palette, opacity, highlighted, selectedId, hoveredId, clipPlanes }: LookProps) {
  const dimmed = highlighted.size > 0 && !highlighted.has(layerId);
  const active = selectedId === layerId || hoveredId === layerId;
  const finalOpacity = dimmed ? 0.08 : (opacity ?? 1);
  return (
    <meshStandardMaterial
      color={PALETTE[palette as keyof typeof PALETTE]}
      emissive={active ? '#ffd166' : '#000000'}
      emissiveIntensity={active ? 0.35 : 0}
      metalness={palette === 'copper' || palette === 'solder' ? 0.6 : 0.05}
      roughness={0.55}
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
  return (
    <mesh position={block.position} {...pointerHandlers(block.layerId, handlers)}>
      <boxGeometry args={block.size} />
      <LayerMaterial layerId={block.layerId} palette={block.palette} opacity={block.opacity} {...look} />
    </mesh>
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

const DEFAULT_VIEW = { position: new THREE.Vector3(26, 16, 26), target: new THREE.Vector3(0, 2, 0) };
/** 聚焦時至少維持的俯角，避免 fitToBox 轉成正面平視而失去立體感 */
const MIN_ELEVATION = THREE.MathUtils.degToRad(28);

function CameraRig({ focus, focusKey }: { focus: FocusBox | null; focusKey: number }) {
  const ref = useRef<CameraControls>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    if (!focus) {
      const { position: p, target: t } = DEFAULT_VIEW;
      controls.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true);
      return;
    }
    const target = new THREE.Vector3(...focus.center);
    const radius = Math.max(new THREE.Vector3(...focus.size).length() / 2, 1.2);
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
  lidPassive,
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
    if (lidPassive) ids.add('lid');
    return ids;
  }, [layout, highlighted, lidPassive]);
  const handlers = { onSelectLayer, onHoverLayer, clipX, passive };

  return (
    <Canvas
      camera={{ position: [26, 16, 26], fov: 35 }}
      gl={{ localClippingEnabled: true, antialias: true }}
      onPointerMissed={() => onHoverLayer(null)}
    >
      <color attach="background" args={['#0f1720']} />
      <hemisphereLight args={['#ffffff', '#334155', 1.1]} />
      <directionalLight position={[10, 20, 8]} intensity={1.6} />
      <directionalLight position={[-12, 6, -10]} intensity={0.5} />
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
      <gridHelper args={[60, 30, '#1e293b', '#1e293b']} position={[0, -0.01, 0]} />
      <CameraRig focus={focus} focusKey={focusKey} />
    </Canvas>
  );
}
