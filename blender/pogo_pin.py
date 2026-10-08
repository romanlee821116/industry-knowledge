"""Final-test socket micro-model: pogo pins in a socket housing, between the package BGA balls
and the load board. The middle pin's barrel is cut in half to show the spring and plungers.

Run: Blender --background --python pogo_pin.py -- <out.glb>
Object name prefixes are read by the web app:
  loadboard_, lb_pad_, socket_housing, barrel_, spring_, plunger_, crown_, ball_, package_.
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

PINS_X = (-1.5, 0.0, 1.5)
W, D = 5.0, 2.4
LB_T = 0.45
HOUSING_H = 3.0
BARREL = (0.5, 2.5)  # z range of the barrel
R_OUT, R_IN = 0.22, 0.18
PLUNGER_R = 0.12


def main(out):
    m.reset_scene()
    pcb = m.material("pcb", (0.25, 0.48, 0.32, 1), roughness=0.6)
    gold = m.material("gold", (0.95, 0.75, 0.3, 1), metallic=1.0, roughness=0.25)
    housing = m.material("housing", (0.25, 0.27, 0.3, 1), roughness=0.5, alpha=0.3)
    steel = m.material("steel", (0.75, 0.77, 0.8, 1), metallic=1.0, roughness=0.3)
    solder = m.material("solder", (0.78, 0.78, 0.8, 1), metallic=0.9, roughness=0.3)
    substrate = m.material("substrate", (0.35, 0.55, 0.75, 1), roughness=0.6)

    m.box("loadboard_body", (0, 0, -LB_T / 2), (W + 1.2, D + 0.8, LB_T), pcb)
    m.box("socket_housing", (0, 0, HOUSING_H / 2), (W, D, HOUSING_H), housing)

    for i, x in enumerate(PINS_X):
        m.box(f"lb_pad_{i}", (x, 0, 0.015), (0.42, 0.42, 0.03), gold)
        # Bottom plunger: cone tip on the load-board pad, shaft into the barrel
        m.frustum(f"plunger_bottom_tip_{i}", (x, 0), 0.02, PLUNGER_R, 0.03, 0.25, gold)
        m.frustum(f"plunger_bottom_{i}", (x, 0), PLUNGER_R, PLUNGER_R, 0.25, 0.9, gold)
        # Barrel (middle pin cut open)
        m.tube(f"barrel_{i}", (x, 0), R_OUT, R_IN, BARREL[0], BARREL[1], gold, half=(i == 1))
        # Spring between the two plungers
        turns, z0, z1, r = 9, 0.9, 2.1, 0.145
        path = [
            Vector((x + r * math.cos(2 * math.pi * turns * t), r * math.sin(2 * math.pi * turns * t), z0 + (z1 - z0) * t))
            for t in (s / 360 for s in range(361))
        ]
        m.sweep(f"spring_{i}", path, 0.022, 0.022, steel, segments=6)
        # Top plunger with a 4-point crown that grips the solder ball
        top = HOUSING_H + 0.15
        m.frustum(f"plunger_top_{i}", (x, 0), PLUNGER_R, PLUNGER_R, 2.1, top, gold)
        for c in range(4):
            a = math.pi / 4 + c * math.pi / 2
            cx, cy = x + 0.07 * math.cos(a), 0.07 * math.sin(a)
            m.frustum(f"crown_{i}_{c}", (cx, cy), 0.05, 0.005, top, top + 0.12, gold, segments=8)
        m.sphere(f"ball_{i}", (x, 0, top + 0.12 + 0.3), 0.32, solder, z_scale=0.9)

    pkg_z = HOUSING_H + 0.15 + 0.12 + 0.3 + 0.27
    m.box("package_substrate", (0, 0, pkg_z + 0.25), (W - 0.4, D - 0.2, 0.5), substrate)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "pogo_pin.glb"))
