"""Test floor: wafer probing (CP, left) and final test (FT, right), each a vertical stack that
separates when exploded.

CP: prober + chuck(0) → wafer(1) → probe head(2) → space transformer(3) → probe card PCB(4) → pogo tower(5) → test head(6)
FT: test head(0) → load board(1) → socket(2) → DUT(3) → handler thermal head(4)

Run: Blender --background --python test_scene.py -- <out.glb> <meta.json>
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

import lib_mesh as m  # noqa: E402
from lib_scene import B, C, M, S, bus, join, mats, nm, traces, write_meta  # noqa: E402

CP_X, FT_X = -7.5, 7.5


def grid(cols, rows, w, d, cx=0.0, cy=0.0):
    for i in range(cols):
        for j in range(rows):
            yield (cx - w / 2 + w * i / max(cols - 1, 1), cy - d / 2 + d * j / max(rows - 1, 1))


def build_cp():
    P = m.add_empty("cp")
    P.location = (CP_X, 0, 0)
    z = 0.0
    # Prober: cabinet with XY stage and chuck (tier 0)
    B(P, "prober-chuck", "cabinet", (0, 0, 0.4), (9.5, 8.5, 0.8), "panel", bev=0.05)
    B(P, "prober-chuck", "front", (0, -4.26, 0.45), (8.5, 0.04, 0.5), "panel_alt", bev=0.01)
    B(P, "prober-chuck", "screen", (3.2, -4.3, 0.5), (1.2, 0.03, 0.35), "screen", bev=0)
    for y in (-1.5, 1.5):
        B(P, "prober-chuck", "rail", (0, y, 0.86), (7.5, 0.25, 0.12), "steel", bev=0.02)
    B(P, "prober-chuck", "stage", (0, 0, 0.98), (5.2, 5.2, 0.16), "trim", bev=0.03)
    C(P, "prober-chuck", "chuck", (0, 0), 4.3, 1.06, 1.4, "steel", segments=96)
    z = 1.4
    # Wafer with die grid (tier 1)
    C(P, "wafer", "wafer", (0, 0), 4.0, z, z + 0.05, "silicon", 1, segments=96)
    dies = [B(P, "wafer", "die", (x, y, z + 0.06), (0.62, 0.62, 0.012), "die", 1, bev=0) for x, y in grid(12, 12, 7.2, 7.2) if math.hypot(x, y) < 3.6]
    join(dies, nm("wafer", "dies", 1))
    z += 0.25
    # Probe head: ceramic guide-plate housing with vertical probes (tier 2)
    probes = [C(P, "probe-head", "pin", (x, y), 0.02, z, z + 0.65, "probe", 2, segments=6) for x, y in grid(18, 18, 2.0, 2.0)]
    join(probes, nm("probe-head", "probes", 2))
    B(P, "probe-head", "lower_guide", (0, 0, z + 0.2), (2.6, 2.6, 0.08), "ceramic", 2, bev=0.01)
    B(P, "probe-head", "upper_guide", (0, 0, z + 0.55), (2.6, 2.6, 0.08), "ceramic", 2, bev=0.01)
    for x, y in ((-1.25, 0), (1.25, 0), (0, -1.25), (0, 1.25)):
        B(P, "probe-head", "spacer", (x, y, z + 0.375), (0.1 if x else 2.6, 2.6 if x else 0.1, 0.27), "ceramic", 2, bev=0)
    z += 0.65
    # Space transformer: multilayer ceramic with pad array (tier 3)
    B(P, "space-transformer", "mlc", (0, 0, z + 0.15), (3.6, 3.6, 0.3), "st", 3, bev=0.02)
    pads = [B(P, "space-transformer", "pad", (x, y, z + 0.305), (0.12, 0.12, 0.01), "gold", 3, bev=0) for x, y in grid(12, 12, 3.0, 3.0)]
    join(pads, nm("space-transformer", "pads", 3))
    z += 0.3
    # Probe card PCB: large round board with relays/caps and a metal stiffener (tier 4)
    C(P, "probe-card-pcb", "board", (0, 0), 5.6, z, z + 0.32, "pcb_green", 4, segments=96)
    parts = []
    for k in range(40):
        a = k / 40 * 2 * math.pi
        for r in (3.2, 4.3):
            parts.append(B(P, "probe-card-pcb", "relay", (r * math.cos(a), r * math.sin(a), z + 0.42), (0.28, 0.18, 0.2), "dark" if r > 4 else "mlcc", 4, bev=0.02))
    for k in range(64):  # edge contacts for the pogo tower
        a = k / 64 * 2 * math.pi
        parts.append(B(P, "probe-card-pcb", "contact", (5.2 * math.cos(a), 5.2 * math.sin(a), z + 0.325), (0.18, 0.18, 0.01), "gold", 4, bev=0))
    join(parts, nm("probe-card-pcb", "components", 4))
    stiff = [B(P, "probe-card-pcb", "stiffener", (0, 0, z + 0.45), (5.0, 0.4, 0.25), "aluminum", 4, bev=0.03),
             B(P, "probe-card-pcb", "stiffener", (0, 0, z + 0.45), (0.4, 5.0, 0.25), "aluminum", 4, bev=0.03)]
    stiff.append(m.tube(nm("probe-card-pcb", "ring", 4), (0, 0), 2.6, 2.3, z + 0.32, z + 0.58, M["aluminum"], segments=64, parent=P))
    join(stiff, nm("probe-card-pcb", "stiffener", 4))
    z += 0.6
    # Pogo tower: ring of pogo blocks between test head and card (tier 5)
    m.tube(nm("pogo-tower", "ring", 5), (0, 0), 5.5, 4.6, z, z + 0.7, M["trim"], segments=96, parent=P)
    blocks = []
    for k in range(24):
        a = k / 24 * 2 * math.pi
        blocks.append(B(P, "pogo-tower", "block", (5.05 * math.cos(a), 5.05 * math.sin(a), z + 0.75), (0.5, 0.5, 0.12), "gold", 5, bev=0.02))
    join(blocks, nm("pogo-tower", "blocks", 5))
    z += 0.85
    # Test head (tier 6): heavy cast body, cooling hoses, cable bundle to the mainframe
    B(P, "ate-head", "body", (0, 0, z + 0.75), (10.5, 9.5, 1.5), "panel_alt", 6, bev=0.12)
    B(P, "ate-head", "top", (0, 0, z + 1.55), (8.0, 7.0, 0.2), "trim", 6, bev=0.05)
    for k in range(12):
        B(P, "ate-head", "fin", (-4.4 + k * 0.8, 4.8, z + 0.75), (0.08, 0.3, 1.2), "trim", 6, bev=0)
    S(P, "ate-head", "cable", [(0, 4.7, z + 1.0), (0, 6.5, z + 1.2), (0, 7.5, 0.6)], 0.55, 0.45, "cable", 6, segments=16)
    S(P, "ate-head", "hose", [(-3, 4.7, z + 0.4), (-3.2, 6.2, z + 0.2), (-3.5, 7.0, 0.3)], 0.12, 0.12, "hose_blue", 6)
    S(P, "ate-head", "hose", [(-2.4, 4.7, z + 0.4), (-2.6, 6.2, z + 0.2), (-2.9, 7.0, 0.3)], 0.12, 0.12, "hose_red", 6)


def build_ft():
    P = m.add_empty("ft")
    P.location = (FT_X, 0, 0)
    # Test head (tier 0)
    B(P, "ate-head", "ft_body", (0, 0, 0.65), (9.0, 8.0, 1.3), "panel_alt", 0, bev=0.1)
    B(P, "ate-head", "ft_interface", (0, 0, 1.34), (7.0, 6.0, 0.08), "trim", 0, bev=0.02)
    S(P, "ate-head", "ft_cable", [(0, 4.0, 0.8), (0, 5.5, 0.6), (0, 6.5, 0.3)], 0.5, 0.4, "cable", 0, segments=16)
    z = 1.38
    # Load board (tier 1): thick PCB with power components and the socket footprint
    B(P, "load-board", "board", (0, 0, z + 0.16), (8.0, 7.0, 0.32), "pcb_green", 1, bev=0.02)
    routes = bus((1.9, 0), (1, 0), 10, 0.12, 0.3, 0.5, 1.3) + bus((-1.9, 0), (-1, 0), 10, 0.12, 0.3, 0.5, 1.3)
    routes += bus((0, 1.9), (0, 1), 10, 0.12, 0.2, 0.4, 0.75) + bus((0.8, -1.9), (0, -1), 6, 0.12, 0.2, 0.4, 0.75)
    traces(P, "load-board", z + 0.32, routes, 0.045, 1)
    comps = []
    for x, y in grid(10, 2, 6.8, 5.8):
        comps.append(B(P, "load-board", "relay", (x, y, z + 0.42), (0.35, 0.25, 0.2), "dark", 1, bev=0.02))
    for x, y in grid(2, 6, 6.8, 4.4):
        comps.append(B(P, "load-board", "cap", (x, y, z + 0.4), (0.3, 0.18, 0.16), "mlcc", 1, bev=0.02))
    for k in range(4):
        comps.append(C(P, "load-board", "bulk_cap", (-2.8 + k * 0.5, -2.2), 0.18, z + 0.32, z + 0.8, "aluminum", 1, segments=16))
    join(comps, nm("load-board", "components", 1))
    B(P, "load-board", "stiffener", (0, 0, z - 0.08), (4.2, 4.2, 0.16), "aluminum", 1, bev=0.03)
    z += 0.32
    # Test socket (tier 2): insulating body, alignment pins, pogo-pin field
    B(P, "test-socket", "body", (0, 0, z + 0.3), (3.6, 3.6, 0.6), "socket", 2, bev=0.04)
    pins = [C(P, "test-socket", "pin", (x, y), 0.045, z + 0.6, z + 0.66, "gold", 2, segments=8) for x, y in grid(16, 16, 2.5, 2.5)]
    join(pins, nm("test-socket", "pins", 2))
    for x, y in ((-1.6, -1.6), (1.6, 1.6)):
        C(P, "test-socket", "align", (x, y), 0.08, z + 0.6, z + 0.85, "steel", 2, segments=12)
    z += 0.7
    # Device under test (tier 3): the CoWoS package
    B(P, "dut-package", "substrate", (0, 0, z + 0.11), (3.0, 3.0, 0.22), "mask_green", 3, bev=0.01)
    B(P, "dut-package", "lid", (0, 0, z + 0.33), (2.6, 2.6, 0.22), "nickel", 3, bev=0.04)
    z += 0.7
    # Handler thermal head / plunger (tier 4)
    B(P, "handler", "plunger", (0, 0, z + 0.25), (2.4, 2.4, 0.5), "aluminum", 4, bev=0.05)
    for k in range(9):
        B(P, "handler", "fin", (-1.2 + k * 0.3, 0, z + 0.85), (0.08, 2.4, 0.7), "aluminum", 4, bev=0)
    B(P, "handler", "arm", (0, 0, z + 1.9), (1.2, 1.2, 1.4), "panel", 4, bev=0.06)
    B(P, "handler", "beam", (0, 2.2, z + 2.45), (1.0, 4.4, 0.4), "panel", 4, bev=0.06)
    S(P, "handler", "hose", [(-0.4, 1.2, z + 0.6), (-0.4, 2.5, z + 1.0), (-0.4, 4.2, z + 2.2)], 0.09, 0.09, "hose_blue", 4)
    S(P, "handler", "hose", [(0.4, 1.2, z + 0.6), (0.4, 2.5, z + 1.0), (0.4, 4.2, z + 2.2)], 0.09, 0.09, "hose_red", 4)


def main(out, meta):
    m.reset_scene()
    mats()
    build_cp()
    build_ft()
    write_meta(meta)
    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :]
    main(argv[0], argv[1])
