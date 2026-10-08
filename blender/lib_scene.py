"""Shared helpers for full-scene models (fab / package / test / rack).

Mesh naming read by the web app:  <layerId>__<part>[__e<k>][__v<variant>]
  - layerId : knowledge-card / highlight group
  - __e<k>  : lifted k explode-steps when the viewer explodes the scene
  - __v<id> : only visible when that technology variant is active (e.g. cowos-l, glass-core, cpo)
  - meshes without "__" are decor (floor), never interactive
meta.json : per layer {center, size, tier, anchor} in glTF Y-up coordinates.
"""

import json

import bpy
from mathutils import Vector

import lib_mesh as m

_count = {"n": 0}


def nm(layer, part, tier=0, variant=None):
    _count["n"] += 1
    name = f"{layer}__{part}{_count['n']}"
    if tier:
        name += f"__e{tier}"
    if variant:
        name += f"__v{variant}"
    return name


M = {}


def mats():
    def mat(key, *args, **kw):
        M[key] = m.material(key, *args, **kw)

    mat("panel", (0.78, 0.79, 0.78, 1), roughness=0.42)
    mat("panel_alt", (0.66, 0.69, 0.72, 1), roughness=0.45)
    mat("trim", (0.42, 0.45, 0.5, 1), metallic=0.3, roughness=0.45)
    mat("dark", (0.1, 0.11, 0.13, 1), roughness=0.4)
    mat("black_metal", (0.06, 0.065, 0.075, 1), metallic=0.6, roughness=0.4)
    mat("sheet", (0.32, 0.34, 0.37, 1), metallic=0.7, roughness=0.38)
    mat("screen", (0.03, 0.05, 0.08, 1), roughness=0.12, emission=(0.1, 0.35, 0.7), strength=0.8)
    mat("glass", (0.75, 0.85, 0.95, 1), roughness=0.05, alpha=0.22)
    mat("amber_glass", (1.0, 0.82, 0.35, 1), roughness=0.05, alpha=0.3)
    mat("steel", (0.78, 0.8, 0.83, 1), metallic=0.9, roughness=0.28)
    mat("nickel", (0.82, 0.83, 0.84, 1), metallic=0.55, roughness=0.38)
    mat("aluminum", (0.8, 0.82, 0.85, 1), metallic=0.9, roughness=0.4)
    mat("liquid", (0.25, 0.6, 0.95, 1), roughness=0.05, alpha=0.6)
    mat("foup", (0.3, 0.33, 0.37, 1), roughness=0.3, alpha=0.82)
    mat("foup_door", (0.16, 0.17, 0.2, 1), roughness=0.35)
    mat("copper", (0.85, 0.47, 0.27, 1), metallic=1.0, roughness=0.3)
    mat("gold", (0.95, 0.74, 0.3, 1), metallic=1.0, roughness=0.25)
    mat("solder", (0.76, 0.77, 0.79, 1), metallic=0.95, roughness=0.22)
    mat("quartz", (0.85, 0.92, 0.98, 1), roughness=0.05, alpha=0.55)
    mat("pad", (0.14, 0.14, 0.16, 1), roughness=0.85)
    mat("diamond", (0.82, 0.84, 0.88, 1), metallic=0.7, roughness=0.25)
    mat("plasma", (0.7, 0.4, 1.0, 1), alpha=0.75, emission=(0.65, 0.35, 1.0), strength=6)
    mat("sig_green", (0.2, 0.9, 0.3, 1), emission=(0.2, 1, 0.3), strength=3)
    mat("sig_yellow", (1, 0.85, 0.2, 1), emission=(1, 0.8, 0.1), strength=1)
    mat("sig_red", (0.9, 0.2, 0.2, 1), emission=(1, 0.1, 0.1), strength=0.5)
    mat("led_blue", (0.3, 0.6, 1, 1), emission=(0.3, 0.6, 1), strength=4)
    mat("arrow", (1.0, 0.62, 0.12, 1), emission=(1.0, 0.55, 0.08), strength=1.5)
    mat("floor", (0.36, 0.38, 0.41, 1), roughness=0.8)
    mat("floor_gap", (0.2, 0.21, 0.23, 1), roughness=0.9)
    # silicon / package materials
    mat("silicon", (0.33, 0.36, 0.5, 1), metallic=0.4, roughness=0.18)
    mat("die_back", (0.16, 0.18, 0.24, 1), metallic=0.55, roughness=0.12)
    mat("die", (0.42, 0.5, 0.72, 1), metallic=0.5, roughness=0.15)
    mat("hbm_a", (0.36, 0.37, 0.42, 1), metallic=0.5, roughness=0.2)
    mat("hbm_b", (0.22, 0.23, 0.27, 1), metallic=0.4, roughness=0.25)
    mat("mold", (0.07, 0.07, 0.08, 1), roughness=0.55)
    mat("rdl", (0.62, 0.45, 0.22, 1), roughness=0.45)
    mat("abf", (0.62, 0.62, 0.4, 1), roughness=0.5)
    mat("bt_core", (0.55, 0.6, 0.35, 1), roughness=0.6)
    mat("glass_core", (0.6, 0.85, 0.9, 1), roughness=0.05, alpha=0.5)
    mat("mask_green", (0.08, 0.3, 0.17, 1), roughness=0.35)
    mat("pcb_green", (0.07, 0.24, 0.14, 1), roughness=0.4)
    mat("pcb_edge", (0.6, 0.58, 0.42, 1), roughness=0.6)
    mat("underfill", (0.85, 0.7, 0.35, 1), roughness=0.3, alpha=0.55)
    mat("tim", (0.55, 0.56, 0.6, 1), roughness=0.7)
    mat("mlcc", (0.62, 0.52, 0.38, 1), roughness=0.5)
    mat("inductor", (0.12, 0.12, 0.13, 1), roughness=0.5)
    mat("ceramic", (0.9, 0.88, 0.82, 1), roughness=0.55)
    mat("st", (0.78, 0.66, 0.46, 1), roughness=0.5)
    mat("probe", (0.85, 0.75, 0.45, 1), metallic=1.0, roughness=0.25)
    mat("socket", (0.1, 0.1, 0.12, 1), roughness=0.5)
    mat("hose_blue", (0.15, 0.35, 0.8, 1), roughness=0.4)
    mat("hose_red", (0.8, 0.18, 0.15, 1), roughness=0.4)
    mat("fiber", (0.98, 0.8, 0.25, 1), roughness=0.4)
    mat("cable", (0.08, 0.08, 0.09, 1), roughness=0.6)


def B(P, layer, part, center, size, mat, tier=0, bev=0.02, variant=None):
    obj = m.box(nm(layer, part, tier, variant), center, size, M[mat] if isinstance(mat, str) else mat, parent=P)
    if bev:
        m.bevel(obj, min(bev, min(size) / 3))
    return obj


def C(P, layer, part, center, r, z0, z1, mat, tier=0, segments=32, r_top=None, variant=None):
    return m.frustum(
        nm(layer, part, tier, variant),
        center,
        r,
        r if r_top is None else r_top,
        z0,
        z1,
        M[mat] if isinstance(mat, str) else mat,
        segments=segments,
        parent=P,
    )


def S(P, layer, part, path, rw, rh, mat, tier=0, segments=10, variant=None, phase=0.0):
    return m.sweep(
        nm(layer, part, tier, variant),
        [Vector(p) for p in path],
        rw,
        rh,
        M[mat] if isinstance(mat, str) else mat,
        segments=segments,
        parent=P,
        phase=phase,
    )


def join(objs, name):
    """Merge many small primitives (balls, bumps, passives) into one mesh for performance."""
    objs = [o for o in objs if o is not None]
    if len(objs) == 1:
        objs[0].name = name
        return objs[0]
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    out = bpy.context.view_layer.objects.active
    out.name = name
    return out


def write_meta(path):
    """Per layer: union bounds, explode tier and label anchor (first mesh created for that layer)."""
    bpy.context.view_layer.update()
    data = {}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or "__" not in obj.name:
            continue
        layer = obj.name.split("__")[0]
        tier = 0
        for token in obj.name.split("__")[1:]:
            if token.startswith("e") and token[1:].isdigit():
                tier = int(token[1:])
        pts = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
        g = [(p.x, p.z, -p.y) for p in pts]  # Blender Z-up -> glTF Y-up
        lo = [min(p[a] for p in g) for a in range(3)]
        hi = [max(p[a] for p in g) for a in range(3)]
        idx = int("".join(ch for ch in obj.name.split("__")[1] if ch.isdigit()) or 0)
        entry = data.get(layer)
        if entry is None:
            data[layer] = {"lo": lo, "hi": hi, "first": idx, "tier": tier, "anchor": [(lo[a] + hi[a]) / 2 for a in range(3)]}
            continue
        entry["lo"] = [min(entry["lo"][a], lo[a]) for a in range(3)]
        entry["hi"] = [max(entry["hi"][a], hi[a]) for a in range(3)]
        if idx < entry["first"]:
            entry.update(first=idx, tier=tier, anchor=[(lo[a] + hi[a]) / 2 for a in range(3)])
    out = {
        layer: {
            "center": [round((e["lo"][a] + e["hi"][a]) / 2, 3) for a in range(3)],
            "size": [round(e["hi"][a] - e["lo"][a], 3) for a in range(3)],
            "tier": e["tier"],
            "anchor": [round(v, 3) for v in e["anchor"]],
        }
        for layer, e in sorted(data.items())
    }
    with open(path, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
