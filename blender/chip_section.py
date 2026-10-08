"""Chip interior micro-model: FinFET transistors (FEOL), contacts (MOL) and copper interconnect
stack (BEOL) up to the top pad and micro-bump. Dielectrics are translucent so the wiring reads.

Run: Blender --background --python chip_section.py -- <out.glb>
Object name prefixes are read by the web app:
  substrate, sti, fin_, gate_, epi_, contact_, ild_, m1_..m4_, via_, pad_top, passivation, bump_pillar, solder_cap.
"""

import os
import sys

sys.path.append(os.path.dirname(__file__))

import lib_mesh as m  # noqa: E402

W, D = 6.0, 2.6
FIN_Y = (-0.9, -0.3, 0.3, 0.9)
GATE_X = (-2.0, -1.0, 0.0, 1.0, 2.0)
SD_X = (-1.5, -0.5, 0.5, 1.5)


def main(out):
    m.reset_scene()
    si = m.material("silicon", (0.36, 0.38, 0.5, 1), roughness=0.35)
    oxide = m.material("oxide", (0.75, 0.85, 0.95, 1), roughness=0.3, alpha=0.25)
    lowk = m.material("lowk", (0.55, 0.7, 0.95, 1), roughness=0.3, alpha=0.18)
    gate = m.material("gate", (0.45, 0.47, 0.52, 1), metallic=0.8, roughness=0.35)
    epi = m.material("epi", (0.85, 0.55, 0.6, 1), roughness=0.5)
    contact = m.material("contact", (0.55, 0.6, 0.7, 1), metallic=0.9, roughness=0.3)
    copper = m.material("copper", (0.85, 0.45, 0.25, 1), metallic=1.0, roughness=0.35)
    pad = m.material("pad", (0.8, 0.82, 0.85, 1), metallic=1.0, roughness=0.3)
    solder = m.material("solder", (0.78, 0.78, 0.8, 1), metallic=0.9, roughness=0.3)

    # --- FEOL: substrate, STI, fins, gates, source/drain epi ---
    m.box("substrate", (0, 0, -0.5), (W, D, 1.0), si)
    m.box("sti_oxide", (0, 0, 0.1), (W, D, 0.2), oxide)
    for i, y in enumerate(FIN_Y):
        m.box(f"fin_{i}", (0, y, 0.225), (W, 0.12, 0.45), si)
    for i, x in enumerate(GATE_X):
        m.box(f"gate_{i}", (x, 0, 0.5), (0.25, D - 0.3, 0.6), gate)
    for i, x in enumerate(SD_X):
        for j, y in enumerate(FIN_Y):
            m.box(f"epi_{i}_{j}", (x, y, 0.55), (0.42, 0.26, 0.22), epi)

    # --- MOL: trench contacts on source/drain ---
    for i, x in enumerate(SD_X):
        m.box(f"contact_{i}", (x, 0, 0.85), (0.18, D - 0.5, 0.38), contact)
    m.box("ild_0", (0, 0, 0.6), (W, D, 0.8), oxide)

    # --- BEOL: alternating-direction copper levels, pitch grows going up ---
    levels = [
        # name, along, positions, width, z0, thickness
        ("m1", "x", (-1.0, -0.5, 0.0, 0.5, 1.0), 0.14, 1.15, 0.2),
        ("m2", "y", (-2.5, -1.5, -0.5, 0.5, 1.5, 2.5), 0.18, 1.55, 0.25),
        ("m3", "x", (-0.9, -0.3, 0.3, 0.9), 0.3, 2.05, 0.35),
        ("m4", "y", (-2.0, 0.0, 2.0), 0.6, 2.8, 0.6),
    ]
    z_prev_top = 1.04
    prev = None
    for name, along, positions, width, z0, t in levels:
        for k, p in enumerate(positions):
            if along == "x":
                m.box(f"{name}_{k}", (0, p, z0 + t / 2), (W - 0.2, width, t), copper)
            else:
                m.box(f"{name}_{k}", (p, 0, z0 + t / 2), (width, D - 0.2, t), copper)
        m.box(f"ild_{name}", (0, 0, (z_prev_top + z0 + t) / 2), (W, D, z0 + t - z_prev_top), lowk)
        # Vias at crossings with the level below
        if prev is not None:
            p_name, p_along, p_pos, p_w, p_z0, p_t = prev
            for a in p_pos[::2]:
                for b in positions[::2]:
                    x, y = (b, a) if p_along == "x" else (a, b)
                    r = min(p_w, width) * 0.4
                    m.frustum(f"via_{name}_{a:+.1f}_{b:+.1f}", (x, y), r, r, p_z0 + p_t, z0, copper, segments=12)
        else:
            for k, x in enumerate(SD_X):
                m.frustum(f"via_m1_{k}", (x, 0.0), 0.06, 0.06, 1.04, z0, copper, segments=12)
        z_prev_top = z0 + t
        prev = (name, along, positions, width, z0, t)

    # --- Top pad, passivation and the micro-bump that connects to the interposer ---
    m.frustum("via_pad", (0.0, 0.0), 0.2, 0.2, 3.4, 3.7, copper, segments=16)
    m.box("pad_top", (0, 0, 3.775), (1.0, 1.0, 0.15), pad)
    m.box("passivation", (0, 0, 3.65), (W, D, 0.5), oxide)
    m.frustum("bump_pillar", (0.0, 0.0), 0.38, 0.38, 3.9, 4.5, copper, segments=24)
    m.sphere("solder_cap", (0, 0, 4.5), 0.38, solder, z_scale=0.4)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "chip_section.glb"))
