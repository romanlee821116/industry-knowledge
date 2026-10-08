"""Glass fabric micro-model: plain-weave yarns (bundles of ~5 µm filaments) impregnated in resin,
laminated with copper foil = one CCL ply.

Run: Blender --background --python glass_fabric.py -- <out.glb>
Object name prefixes are read by the web app: yarn_warp_*, yarn_weft_*, filament_*, resin, copper_top, copper_bottom.
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

PITCH = 1.0
COUNT = 8
HALF_W = 0.42  # yarn half width (gaps between yarns are real: resin fills them)
HALF_H = 0.075
AMP = 0.085  # crimp amplitude; > HALF_H so crossing yarns never intersect
SAMPLES_PER_PITCH = 24
EXTENT = (COUNT - 1) * PITCH
OFFSET = EXTENT / 2
MARGIN = 0.6


def main(out):
    m.reset_scene()
    glass = m.material("glass", (0.86, 0.9, 0.94, 1), roughness=0.25)
    glass_alt = m.material("glass_alt", (0.72, 0.8, 0.88, 1), roughness=0.25)
    resin = m.material("resin", (0.95, 0.8, 0.35, 1), roughness=0.4, alpha=0.35)
    copper = m.material("copper", (0.85, 0.45, 0.25, 1), metallic=1.0, roughness=0.35)

    lo, hi = -OFFSET - MARGIN, OFFSET + MARGIN
    steps = int((hi - lo) / PITCH * SAMPLES_PER_PITCH)

    for i in range(COUNT):
        y = i * PITCH - OFFSET
        sign = 1 if i % 2 == 0 else -1
        path = [
            Vector((x, y, sign * AMP * math.cos(math.pi * (x + OFFSET) / PITCH)))
            for x in (lo + k * (hi - lo) / steps for k in range(steps + 1))
        ]
        m.sweep(f"yarn_warp_{i}", path, HALF_W, HALF_H, glass)

    for j in range(COUNT):
        x = j * PITCH - OFFSET
        sign = 1 if j % 2 == 0 else -1
        path = [
            Vector((x, y, -sign * AMP * math.cos(math.pi * (y + OFFSET) / PITCH)))
            for y in (lo + k * (hi - lo) / steps for k in range(steps + 1))
        ]
        m.sweep(f"yarn_weft_{j}", path, HALF_W, HALF_H, glass_alt)

    # Frayed end of warp yarn 0: show that a yarn is a bundle of filaments.
    y0 = -OFFSET
    start_x = hi
    rows = [(-0.05, 5), (0.0, 7), (0.05, 5)]
    k = 0
    for dz, count in rows:
        for c in range(count):
            dy = (c - (count - 1) / 2) * 0.1
            path = []
            for s in range(13):
                t = s / 12
                spread = 1 + 1.8 * t * t
                path.append(Vector((start_x + t * 1.4, y0 + dy * spread, AMP + dz * spread)))
            m.sweep(f"filament_{k}", path, 0.028, 0.028, glass, segments=8)
            k += 1
    # Continue warp 0 to the filament root so the bundle visibly splits.
    m.sweep(
        "yarn_warp_0_tail",
        [Vector((hi + d * 0.02, y0, AMP)) for d in range(6)],
        HALF_W * 0.8,
        HALF_H,
        glass,
    )

    size = hi - lo
    resin_h = 2 * (AMP + HALF_H) + 0.12
    m.box("resin", (0, 0, 0), (size, size, resin_h), resin)
    cu_t = 0.06
    # Top foil covers only half so the impregnated fabric stays visible.
    m.box("copper_top", (lo + size * 0.25, 0, resin_h / 2 + cu_t / 2), (size / 2, size, cu_t), copper)
    m.box("copper_bottom", (0, 0, -resin_h / 2 - cu_t / 2), (size, size, cu_t), copper)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "glass_fabric.glb"))
