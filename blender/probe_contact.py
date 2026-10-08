"""Wafer probing (CP) micro-model: vertical buckling-beam probes held by ceramic guide plates,
pushed by the space transformer onto micro-bumps of a wafer.

Run: Blender --background --python probe_contact.py -- <out.glb>
Object name prefixes are read by the web app: wafer_, pad_, bump_, solder_, probe_, tip_, guide_, st_body, st_pad_.
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

COLS, ROWS = 6, 3
PITCH = 0.9
W = COLS * PITCH + 0.6
D = ROWS * PITCH + 0.6
WAFER_T = 0.45
PAD_T = 0.04
PILLAR_H = 0.22
CAP_H = 0.1
TIP_Z = PAD_T + PILLAR_H + CAP_H * 0.6  # tip digs slightly into the solder cap (scrub mark)
PROBE_LEN = 2.6
BOW = 0.2  # buckling offset when the probe is compressed


def main(out):
    m.reset_scene()
    silicon = m.material("silicon", (0.36, 0.38, 0.5, 1), roughness=0.35)
    copper = m.material("copper", (0.85, 0.45, 0.25, 1), metallic=1.0, roughness=0.35)
    solder = m.material("solder", (0.78, 0.78, 0.8, 1), metallic=0.9, roughness=0.3)
    probe = m.material("probe", (0.85, 0.75, 0.45, 1), metallic=1.0, roughness=0.25)
    ceramic = m.material("ceramic", (0.92, 0.92, 0.88, 1), roughness=0.6, alpha=0.4)
    st = m.material("st", (0.82, 0.72, 0.55, 1), roughness=0.6)

    m.box("wafer_slice", (0, 0, -WAFER_T / 2), (W, D, WAFER_T), silicon)

    xs = [(i - (COLS - 1) / 2) * PITCH for i in range(COLS)]
    ys = [(j - (ROWS - 1) / 2) * PITCH for j in range(ROWS)]
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            k = f"{i}_{j}"
            m.box(f"pad_{k}", (x, y, PAD_T / 2), (0.36, 0.36, PAD_T), copper)
            m.frustum(f"bump_pillar_{k}", (x, y), 0.13, 0.13, PAD_T, PAD_T + PILLAR_H, copper)
            m.sphere(f"solder_cap_{k}", (x, y, PAD_T + PILLAR_H), 0.13, solder, z_scale=CAP_H / 0.13)

            # Buckled vertical probe: S-free single bow, as a compressed "cobra" beam
            path = []
            for s in range(25):
                t = s / 24
                path.append(Vector((x + BOW * math.sin(math.pi * t), y, TIP_Z + 0.12 + t * (PROBE_LEN - 0.12))))
            m.sweep(f"probe_beam_{k}", path, 0.035, 0.035, probe, segments=8, up_hint=Vector((0, 1, 0)))
            m.frustum(f"tip_{k}", (x, y), 0.008, 0.035, TIP_Z, TIP_Z + 0.12, probe, segments=10)

    lower = TIP_Z + 0.35
    upper = TIP_Z + PROBE_LEN - 0.45
    m.box("guide_lower", (0, 0, lower + 0.08), (W, D, 0.16), ceramic)
    m.box("guide_upper", (0, 0, upper + 0.08), (W, D, 0.16), ceramic)

    st_z = TIP_Z + PROBE_LEN
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            m.box(f"st_pad_{i}_{j}", (x, y, st_z + 0.02), (0.3, 0.3, 0.04), copper)
    m.box("st_body", (0, 0, st_z + 0.04 + 0.3), (W, D, 0.6), st)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "probe_contact.glb"))
