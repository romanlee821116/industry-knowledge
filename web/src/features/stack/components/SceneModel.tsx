'use client';

import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';

/** 與 layoutBuilder 的爆炸間距一致 */
const EXPLODE_GAP = 0.9;

interface Part {
  mesh: THREE.Mesh;
  layer: string | null;
  tier: number;
  baseY: number;
  base: THREE.Material;
  dim: THREE.Material;
  active: THREE.Material;
}

/** Blender 端的命名規則：<layerId>__<part>[__e<k>]；沒有 "__" 的是裝飾（地板） */
function parseName(name: string) {
  const i = name.indexOf('__');
  if (i < 0) return { layer: null, tier: 0 };
  const tier = name.match(/__e(\d+)$/);
  return { layer: name.slice(0, i), tier: tier ? Number(tier[1]) : 0 };
}

function variants(base: THREE.Material) {
  const dim = base.clone();
  dim.setValues({ transparent: true, opacity: Math.min(base.opacity, 1) * 0.08, depthWrite: false });
  const active = base.clone();
  if (active instanceof THREE.MeshStandardMaterial) {
    active.setValues({ emissive: new THREE.Color('#ffd166'), emissiveIntensity: 0.15 });
  }
  return { dim, active };
}

/** three.js 物件為命令式狀態：在 effect 中同步位移、材質與剖面 */
function applyLook(part: Part, offsetY: number, material: THREE.Material, clipPlanes: THREE.Plane[]) {
  part.mesh.position.setY(part.baseY + offsetY);
  for (const mat of [part.base, part.dim, part.active]) mat.setValues({ clippingPlanes: clipPlanes });
  Object.assign(part.mesh, { material });
}

interface Props {
  url: string;
  explode: number;
  highlighted: Set<string>;
  selectedId: string | null;
  hoveredId: string | null;
  clipPlanes: THREE.Plane[];
  clipX: number | null;
  passive: Set<string>;
  onSelectLayer: (id: string) => void;
  onHoverLayer: (id: string | null) => void;
}

export function SceneModel({
  url,
  explode,
  highlighted,
  selectedId,
  hoveredId,
  clipPlanes,
  clipX,
  passive,
  onSelectLayer,
  onHoverLayer,
}: Props) {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const parts: Part[] = [];
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const { layer, tier } = parseName(obj.name);
      obj.castShadow = layer !== null;
      obj.receiveShadow = true;
      const base = obj.material as THREE.Material;
      parts.push({ mesh: obj, layer, tier, baseY: obj.position.y, base, ...variants(base) });
    });
    return { root, parts };
  }, [scene]);

  useLayoutEffect(() => {
    for (const part of model.parts) {
      const dimmed = part.layer !== null && highlighted.size > 0 && !highlighted.has(part.layer);
      const active = part.layer !== null && (part.layer === selectedId || part.layer === hoveredId);
      const material = dimmed ? part.dim : active ? part.active : part.base;
      applyLook(part, part.tier * explode * EXPLODE_GAP, material, clipPlanes);
    }
  }, [model, explode, highlighted, selectedId, hoveredId, clipPlanes]);

  const interactiveLayer = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const { layer } = parseName(e.object.name);
    if (!layer || passive.has(layer)) return null;
    if (highlighted.size > 0 && !highlighted.has(layer)) return null;
    // Raycaster 不理會剖面平面：被剖掉的一側不攔截事件
    if (clipX !== null && e.point.x > clipX + 1e-3) return null;
    return layer;
  };

  return (
    <primitive
      object={model.root}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        const layer = interactiveLayer(e);
        if (!layer) return;
        e.stopPropagation();
        onSelectLayer(layer);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        const layer = interactiveLayer(e);
        if (!layer) return;
        e.stopPropagation();
        onHoverLayer(layer);
      }}
      onPointerOut={() => onHoverLayer(null)}
    />
  );
}
