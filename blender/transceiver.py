"""800G pluggable optical transceiver (OSFP-style) cutaway: electrical edge connector → DSP →
laser driver / TIA → laser and photodiode arrays → lens array → fibers → MPO connector.
The top shell is translucent so the inside reads.

Run: Blender --background --python transceiver.py -- <out.glb>
Object name prefixes are read by the web app:
  shell_bottom, shell_top, fin_, pcb, finger_, dsp, driver_, tia_, submount, laser_, pd_, lens_, fiber_, mpo.
"""

import os
import sys

sys.path.append(os.path.dirname(__file__))

from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

L, Wd = 10.0, 2.4
LANES = 8
PITCH = 0.11


def main(out):
    m.reset_scene()
    shell = m.material("shell", (0.72, 0.75, 0.8, 1), metallic=0.8, roughness=0.35)
    shell_glass = m.material("shell_glass", (0.72, 0.75, 0.8, 1), metallic=0.3, roughness=0.3, alpha=0.18)
    pcb = m.material("pcb", (0.25, 0.48, 0.32, 1), roughness=0.6)
    gold = m.material("gold", (0.95, 0.75, 0.3, 1), metallic=1.0, roughness=0.25)
    die = m.material("die", (0.23, 0.28, 0.4, 1), roughness=0.4)
    ceramic = m.material("ceramic", (0.9, 0.88, 0.82, 1), roughness=0.6)
    laser = m.material("laser", (0.75, 0.35, 0.9, 1), roughness=0.3)
    pd = m.material("pd", (0.3, 0.7, 0.75, 1), roughness=0.3)
    lens = m.material("lens", (0.85, 0.95, 1.0, 1), roughness=0.05, alpha=0.6)
    fiber = m.material("fiber", (0.98, 0.8, 0.25, 1), roughness=0.4)
    mpo = m.material("mpo", (0.2, 0.22, 0.25, 1), roughness=0.5)

    # Shell: solid bottom, translucent top with heat-sink fins
    m.box("shell_bottom", (L / 2, 0, 0.06), (L, Wd, 0.12), shell)
    m.box("shell_top", (L / 2, 0, 1.0), (L, Wd, 0.12), shell_glass)
    for k in range(9):
        m.box(f"fin_{k}", (1.2 + k * 0.95, 0, 1.3), (0.12, Wd - 0.2, 0.5), shell_glass)

    # PCB with gold edge fingers (plugs into the switch's OSFP cage)
    m.box("pcb", (4.3, 0, 0.25), (8.4, Wd - 0.3, 0.1), pcb)
    for k in range(12):
        m.box(f"finger_{k}", (0.35, -0.9 + k * 0.165, 0.31), (0.5, 0.1, 0.02), gold)

    # DSP (PAM4 SerDes + retiming) and analog front-end
    m.box("dsp", (2.6, 0, 0.42), (1.5, 1.5, 0.24), die)
    m.box("driver_tx", (4.7, -0.55, 0.37), (0.6, 0.7, 0.14), die)
    m.box("tia_rx", (4.7, 0.55, 0.37), (0.6, 0.7, 0.14), die)

    # Optical sub-assembly: lasers (Tx) and photodiodes (Rx) on a ceramic submount, lens array, fibers
    m.box("submount", (6.3, 0, 0.36), (0.8, Wd - 0.5, 0.12), ceramic)
    tx_y = [-0.95 + i * PITCH for i in range(LANES)]
    rx_y = [0.18 + i * PITCH for i in range(LANES)]
    for i, y in enumerate(tx_y):
        m.box(f"laser_{i}", (6.3, y, 0.48), (0.3, 0.07, 0.12), laser)
    for i, y in enumerate(rx_y):
        m.box(f"pd_{i}", (6.3, y, 0.46), (0.12, 0.08, 0.08), pd)
    for i, y in enumerate(tx_y + rx_y):
        m.sphere(f"lens_{i}", (6.85, y, 0.48), 0.05, lens, rings=8, segments=12)
        path = [Vector((6.95, y, 0.48)), Vector((8.0, y * 0.6, 0.48)), Vector((9.2, y * 0.35, 0.48))]
        m.sweep(f"fiber_{i}", path, 0.025, 0.025, fiber, segments=6)

    m.box("mpo", (9.6, 0, 0.48), (0.8, 1.0, 0.5), mpo)

    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    main(argv[0] if argv else os.path.join(os.path.dirname(__file__), "transceiver.glb"))
