'use client';

import { CameraControls, Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';

import { cn } from '@/shared/lib/cn';

import type { StackLayout } from '../types';
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
  /** 目前啟用的技術版本（cowos-l、glass-core、cpo…），控制模型中對應零件的顯示 */
  variants: string[];
  explode: number;
  /** 未選取任何東西時的鏡頭位置與注視點 */
  home: { position: [number, number, number]; target: [number, number, number] };
  onSelectLayer: (id: string) => void;
  onHoverLayer: (id: string | null) => void;
}

/** 聚焦時至少維持的俯角，避免轉成正面平視而失去立體感 */
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

/** 每幀把標籤的 3D 錨點投影到螢幕座標，直接寫入 DOM 位置（不觸發 React 重新渲染） */
function LabelProjector({ labels, refs }: { labels: StackLabel[]; refs: RefObject<Map<string, HTMLButtonElement>> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const l of labels) {
      const el = refs.current.get(l.id);
      if (!el) continue;
      v.set(...l.position).project(camera);
      const behind = v.z > 1;
      el.style.visibility = behind ? 'hidden' : 'visible';
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translateY(-50%)`;
    }
  });
  return null;
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
  variants,
  explode,
  home,
  onSelectLayer,
  onHoverLayer,
}: Props) {
  const clipPlanes = useMemo(
    () => (clipX === null ? [] : [new THREE.Plane(new THREE.Vector3(-1, 0, 0), clipX)]),
    [clipX],
  );
  const passive = useMemo(() => new Set(passiveIds), [passiveIds]);
  const activeVariants = useMemo(() => new Set(variants), [variants]);
  const labelRefs = useRef(new Map<string, HTMLButtonElement>());

  return (
    <div className={cn('relative h-full w-full', hoveredId && 'cursor-pointer')}>
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
        <Suspense fallback={null}>
          <SceneModel
            url={layout.model.url}
            explode={explode}
            variants={activeVariants}
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
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.04, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <shadowMaterial opacity={0.35} />
        </mesh>
        <gridHelper args={[60, 30, '#1e293b', '#1e293b']} position={[0, -0.05, 0]} />
        <CameraRig focus={focus} focusKey={focusKey} home={home} />
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={1.2} intensity={2.2} distanceFalloff={1} halfRes />
        </EffectComposer>
        <LabelProjector labels={labels} refs={labelRefs} />
      </Canvas>
      {/* 標籤是畫布外的一般 DOM，由 LabelProjector 每幀更新位置（不用 drei Html，避免多個 React root 卸載時與 R3F 衝突） */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map((l) => (
          <button
            key={l.id}
            ref={(el) => {
              if (el) labelRefs.current.set(l.id, el);
              else labelRefs.current.delete(l.id);
            }}
            type="button"
            onClick={() => onSelectLayer(l.id)}
            style={{ visibility: 'hidden' }}
            className={cn(
              'pointer-events-auto absolute left-0 top-0 flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-slate-200',
              (selectedId === l.id || hoveredId === l.id) && 'text-amber-300',
            )}
          >
            <span className="h-px w-8 bg-current opacity-70" />
            <span className="rounded bg-slate-900/80 px-1.5 py-0.5">{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
