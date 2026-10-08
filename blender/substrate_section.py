"""ABF substrate cross-section slice (thicknesses exaggerated, not to scale).

Bottom → top: BGA ball / solder mask / ABF build-up x3 / core (glass-fabric laminate + PTH) / ABF build-up x3 / solder mask / C4 bump.

Run: Blender --background --python substrate_section.py -- <out.glb>
Object name prefixes are read by the web app:
  core_*, glass_yarn_*, pth_*, plug_*, abf_top_*, abf_bot_*, cu_*, via_*, mask_*, c4_*, bga_*
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

W, D = 7.0, 2.0  # slice width (x) and depth (y); front cut face is at y = -D/2
CORE_T = 1.0
CORE_CU_T = 0.05
ABF_T = 0.16
CU_T = 0.035
MASK_T = 0.09
BUILDUP = 3
FRONT = -D / 2 - 0.004  # inner features poke through the cut face so they read on the section
VIA_X = (-2.0, 0.0, 2.0)
PTH_X = (-2.0, 2.0)
PAD_D = D - 0.3  # pads/traces start on the cut face and run back into the slice
PAD_YC = FRONT + PAD_D / 2


def main(out):
    m.reset_scene()
    core_mat = m.material("core", (0.55, 0.62, 0.42, 1), roughness=0.7)
    glass = m.material("glass", (0.88, 0.92, 0.95, 1), roughness=0.3)
    abf = m.material("abf", (0.35, 0.55, 0.75, 1), roughness=0.6)
    copper = m.material("copper", (0.85, 0.45, 0.25, 1), metallic=1.0, roughness=0.35)
    plug = m.material("plug", (0.25, 0.25, 0.28, 1), roughness=0.8)
    mask = m.material("solder_mask", (0.12, 0.42, 0.25, 1), roughness=0.5)
    solder = m.material("solder", (0.78, 0.78, 0.8, 1), metallic=0.9, roughness=0.3)

    z_core_top = CORE_T / 2

    # --- Core: glass-fabric laminate -------------------------------------------------
    m.box("core_dielectric", (0, 0, 0), (W, D, CORE_T), core_mat)
    # Two fabric plies seen in section: weft yarns cut across (ellipses) + the crimped warp yarn on the face.
    pitch = 0.5
    for ply, zc in enumerate((-0.22, 0.22)):
        n = int(W / pitch)
        for k in range(n):
            x = -W / 2 + pitch / 2 + k * pitch
            if any(abs(x - px) < 0.3 for px in PTH_X):
                continue  # drilled away by the PTH
            dz = 0.05 if k % 2 == 0 else -0.05
            path = [Vector((x, FRONT, zc + dz)), Vector((x, D / 2 - 0.01, zc + dz))]
            m.sweep(f"glass_yarn_weft_{ply}_{k}", path, 0.2, 0.05, glass, segments=16)
        warp = [
            Vector((x, FRONT - 0.002, zc - 0.09 * math.cos(math.pi * (x + W / 2 - pitch / 2) / pitch)))
            for x in (-W / 2 + 0.02 + i * (W - 0.04) / 140 for i in range(141))
        ]
        m.sweep(f"glass_yarn_warp_{ply}", warp, 0.004, 0.035, glass, segments=8)

    m.box("cu_core_top", (0, 0, z_core_top + CORE_CU_T / 2), (W, D, CORE_CU_T), copper)
    m.box("cu_core_bot", (0, 0, -z_core_top - CORE_CU_T / 2), (W, D, CORE_CU_T), copper)

    # --- PTH: mechanically drilled, copper-plated barrel, plugged with resin ------------
    for i, px in enumerate(PTH_X):
        z0, z1 = -z_core_top - CORE_CU_T, z_core_top + CORE_CU_T
        m.tube(f"pth_barrel_{i}", (px, FRONT), 0.24, 0.19, z0, z1, copper, half=True)
        m.frustum(f"plug_resin_{i}", (px, FRONT), 0.19, 0.19, z0, z1, plug, half=True)

    # --- Build-up layers (ABF dielectric + SAP copper + laser micro-vias) ---------------
    def buildup(side):
        sign = 1 if side == "top" else -1
        base = z_core_top + CORE_CU_T
        for layer in range(1, BUILDUP + 1):
            z_lo = base + (layer - 1) * ABF_T
            z_hi = z_lo + ABF_T
            zc = sign * (z_lo + z_hi) / 2
            m.box(f"abf_{side}_{layer}", (0, 0, zc), (W, D, ABF_T), abf)
            # Copper pads/traces at the outer surface of this ABF layer
            z_cu = sign * (z_hi - CU_T / 2)
            for vx in VIA_X:
                m.box(f"cu_pad_{side}_{layer}_{vx:+.0f}", (vx, PAD_YC, z_cu), (0.55, PAD_D, CU_T), copper)
            for tx in (-3.0, -1.0, 1.0, 3.0):
                if (layer + int(tx)) % 2:
                    m.box(f"cu_trace_{side}_{layer}_{tx:+.0f}", (tx, PAD_YC, z_cu), (0.18, PAD_D, CU_T), copper)
            # Laser via: narrow at the inner landing pad, wide at the outer capture pad
            for vx in VIA_X:
                inner, outer = sign * z_lo, sign * (z_hi - CU_T)
                m.frustum(f"via_{side}_{layer}_{vx:+.0f}", (vx, FRONT), 0.09, 0.17, inner, outer, copper, half=True)
        return base + BUILDUP * ABF_T

    z_top = buildup("top")
    z_bot = buildup("bot")

    # --- Solder mask with openings, C4 bumps on top, BGA balls on bottom ---------------
    for side, z, sign in (("top", z_top, 1), ("bot", z_bot, -1)):
        edges = [-W / 2] + [v for vx in VIA_X for v in (vx - 0.22, vx + 0.22)] + [W / 2]
        for k in range(0, len(edges), 2):
            x0, x1 = edges[k], edges[k + 1]
            m.box(f"mask_{side}_{k // 2}", ((x0 + x1) / 2, 0, sign * (z + MASK_T / 2)), (x1 - x0, D, MASK_T), mask)
    for vx in VIA_X:
        m.sphere(f"c4_bump_{vx:+.0f}", (vx, FRONT + 0.3, z_top + MASK_T + 0.08), 0.2, solder, z_scale=0.75)
    for vx in PTH_X + (0.0,):
        m.sphere(f"bga_ball_{vx:+.0f}", (vx, FRONT + 0.45, -(z_bot + MASK_T + 0.3)), 0.38, solder)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "substrate_section.glb"))
