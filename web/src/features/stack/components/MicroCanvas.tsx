'use client';

import { Center, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';

import { PALETTE } from '../data/micro-views';
import type { MicroPart, MicroView } from '../types';

interface Props {
  view: MicroView;
  explode: number;
  /** 依版本切換覆寫玻纖顏色（例如石英布） */
  glassTint?: string;
  selectedPrefix: string | null;
  onSelectPart: (prefix: string | null) => void;
}

function matchPart(name: string, parts: MicroPart[]) {
  return parts.find((p) => name.startsWith(p.prefix));
}

function Model({ view, explode, glassTint, selectedPrefix, onSelectPart }: Props) {
  const { scene } = useGLTF(view.url);

  // 每個零件一份材質，依色票上色；只在模型或版本改變時重建
  const prepared = useMemo(() => {
    const root = scene.clone(true);
    const meshes: { mesh: THREE.Mesh; part: MicroPart; base: THREE.Vector3 }[] = [];
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const part = matchPart(obj.name, view.parts);
      if (!part) return;
      const color = part.palette === 'glass' && glassTint ? glassTint : PALETTE[part.palette];
      obj.material = new THREE.MeshStandardMaterial({
        color,
        metalness: part.palette === 'copper' || part.palette === 'solder' ? 0.6 : 0.05,
        roughness: 0.45,
        transparent: part.opacity !== undefined,
        opacity: part.opacity ?? 1,
        depthWrite: part.opacity === undefined,
        side: THREE.DoubleSide,
      });
      meshes.push({ mesh: obj, part, base: obj.position.clone() });
    });
    return { root, meshes };
  }, [scene, view.parts, glassTint]);

  // three.js 物件為命令式狀態，於 effect 中同步分解位移與選取高亮
  useLayoutEffect(() => {
    for (const { mesh, part, base } of prepared.meshes) {
      mesh.position.set(base.x, base.y + (part.explode ?? 0) * explode, base.z);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const active = selectedPrefix === part.prefix;
      mat.setValues({ emissive: active ? '#ffd166' : '#000000', emissiveIntensity: active ? 0.4 : 0 });
    }
  }, [prepared, explode, selectedPrefix]);

  return (
    <Center>
      <primitive
        object={prepared.root}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelectPart(matchPart(e.object.name, view.parts)?.prefix ?? null);
        }}
      />
    </Center>
  );
}

export function MicroCanvas(props: Props) {
  return (
    <Canvas camera={{ position: [9, 8, 12], fov: 35 }} onPointerMissed={() => props.onSelectPart(null)}>
      <color attach="background" args={['#0f1720']} />
      <hemisphereLight args={['#ffffff', '#334155', 1.2]} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} />
      <directionalLight position={[-6, 4, -4]} intensity={0.4} />
      <Suspense fallback={null}>
        <Model {...props} />
      </Suspense>
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}
