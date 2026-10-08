"""Liquid-cooled AI rack (NVL72-class). Trays stack bottom → top, one explode tier each:
power shelf(0) → compute ×2(1,2) → NVLink switch ×2(3,4) → compute ×2(5,6) → power shelf(7) → scale-out switch(8)
Fixed (never lift): rack frame, NVLink copper spine, cooling manifolds, power busbar.

Run: Blender --background --python rack_scene.py -- <out.glb> <meta.json>
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

import lib_mesh as m  # noqa: E402
from lib_scene import B, C, S, join, mats, nm, write_meta  # noqa: E402

W, D, H = 6.0, 8.0, 0.7  # tray width (x), depth (y, front at -D/2), slot height
FRONT = -D / 2


def chassis(layer, z, tier, height=0.5):
    """1U sheet-metal tray: pan, low side walls, perforated front bezel with handles."""
    B(None, layer, "pan", (0, 0, z + 0.025), (W, D, 0.05), "sheet", tier, bev=0)
    for x in (-W / 2 + 0.025, W / 2 - 0.025):
        B(None, layer, "wall", (x, 0, z + height / 2), (0.05, D, height), "sheet", tier, bev=0)
    B(None, layer, "bezel", (0, FRONT + 0.03, z + height / 2), (W, 0.06, height), "black_metal", tier, bev=0.01)
    holes = []
    for i in range(22):
        for j in range(3):
            holes.append(B(None, layer, "vent", (-2.6 + i * 0.165, FRONT - 0.005, z + 0.12 + j * 0.12), (0.1, 0.01, 0.07), "dark", tier, bev=0))
    join(holes, nm(layer, "vents", tier))
    for x in (-W / 2 + 0.25, W / 2 - 0.25):
        S(None, layer, "handle", [(x, FRONT, z + 0.12), (x, FRONT - 0.2, z + 0.15), (x, FRONT - 0.2, z + height - 0.15), (x, FRONT, z + height - 0.12)], 0.03, 0.03, "aluminum", tier, segments=8)
    B(None, layer, "led", (W / 2 - 0.5, FRONT - 0.01, z + height - 0.1), (0.06, 0.02, 0.04), "led_blue", tier, bev=0)


def gpu_board(x, z, tier):
    """Superchip board: 2 GPU packages + 1 CPU under liquid cold plates, LPDDR, VRMs."""
    B(None, "gpu-module", "board", (x, -0.6, z + 0.08), (2.6, 4.4, 0.05), "pcb_green", tier, bev=0)
    hoses = []
    for k, y in enumerate((-1.9, -0.6)):
        B(None, "gpu-module", "gpu_sub", (x, y, z + 0.13), (1.1, 1.1, 0.05), "mask_green", tier, bev=0)
        B(None, "gpu-module", "gpu_lid", (x, y, z + 0.19), (0.9, 0.9, 0.07), "nickel", tier, bev=0.02)
        B(None, "cooling", "coldplate", (x, y, z + 0.28), (1.0, 1.0, 0.12), "copper", tier, bev=0.03)
        hoses.append(S(None, "cooling", "hose", [(x - 0.3, y, z + 0.36), (x - 0.3, y + 0.2, z + 0.45), (x - 0.3, 3.4, z + 0.42), (-2.8, 3.8, z + 0.3)], 0.05, 0.05, "hose_blue", tier))
        hoses.append(S(None, "cooling", "hose", [(x + 0.3, y, z + 0.36), (x + 0.3, y + 0.2, z + 0.45), (x + 0.3, 3.4, z + 0.42), (2.8, 3.8, z + 0.3)], 0.05, 0.05, "hose_red", tier))
    join(hoses, nm("cooling", "hoses", tier))
    B(None, "gpu-module", "cpu_lid", (x, 0.8, z + 0.17), (0.75, 0.75, 0.08), "nickel", tier, bev=0.02)
    B(None, "cooling", "cpu_coldplate", (x, 0.8, z + 0.26), (0.8, 0.8, 0.1), "copper", tier, bev=0.03)
    mem = [B(None, "memory-module", "lpddr", (x + dx, 0.8 + dy, z + 0.13), (0.22, 0.32, 0.05), "mold", tier, bev=0.01) for dx in (-0.6, 0.6) for dy in (-0.25, 0.25)]
    join(mem, nm("memory-module", "lpddr", tier))
    vrm = []
    for k in range(6):
        y = -2.6 + k * 0.45
        vrm.append(B(None, "vrm", "inductor", (x - 1.05, y, z + 0.18), (0.26, 0.26, 0.18), "inductor", tier, bev=0.02))
        vrm.append(B(None, "vrm", "stage", (x - 0.75, y, z + 0.12), (0.18, 0.18, 0.05), "mold", tier, bev=0))
    join(vrm, nm("vrm", "phases", tier))


def compute_tray(z, tier):
    chassis("compute-tray", z, tier)
    for x in (-1.5, 1.5):
        gpu_board(x, z, tier)
    for x in (-0.6, 0.6):
        B(None, "retimer-chip", "chip", (x, 2.4, z + 0.09), (0.3, 0.3, 0.04), "mold", tier, bev=0)
        B(None, "retimer-chip", "heatsink", (x, 2.4, z + 0.16), (0.32, 0.32, 0.1), "aluminum", tier, bev=0.01)
    for x in (-1.8, 1.8):
        B(None, "nic", "card", (x, FRONT + 1.0, z + 0.1), (1.4, 1.2, 0.04), "pcb_green", tier, bev=0)
        B(None, "nic", "asic", (x, FRONT + 1.1, z + 0.17), (0.45, 0.45, 0.1), "aluminum", tier, bev=0.01)
        B(None, "nic", "cage", (x, FRONT + 0.25, z + 0.2), (0.7, 0.5, 0.25), "steel", tier, bev=0.01)
    B(None, "compute-tray", "connector", (0, D / 2 - 0.15, z + 0.2), (5.0, 0.25, 0.3), "dark", tier, bev=0.01)


def switch_tray(z, tier):
    chassis("nvlink-switch", z, tier)
    for x in (-1.3, 1.3):
        B(None, "nvlink-switch", "board", (x, 0, z + 0.08), (2.4, 3.0, 0.05), "pcb_green", tier, bev=0)
        B(None, "nvlink-switch", "asic_lid", (x, 0, z + 0.15), (1.0, 1.0, 0.08), "nickel", tier, bev=0.02)
        B(None, "cooling", "switch_coldplate", (x, 0, z + 0.24), (1.05, 1.05, 0.1), "copper", tier, bev=0.03)
    B(None, "nvlink-switch", "connector", (0, D / 2 - 0.15, z + 0.2), (5.4, 0.25, 0.35), "dark", tier, bev=0.01)


def power_shelf(z, tier):
    chassis("power-shelf", z, tier, height=0.55)
    for k in range(6):
        x = -2.5 + k
        B(None, "psu", "body", (x, -1.6, z + 0.29), (0.9, 4.6, 0.48), "aluminum", tier, bev=0.03)
        B(None, "psu", "grille", (x, FRONT + 0.05, z + 0.29), (0.7, 0.03, 0.38), "dark", tier, bev=0.01)
        B(None, "psu", "handle", (x, FRONT - 0.08, z + 0.29), (0.12, 0.12, 0.3), "black_metal", tier, bev=0.02)
        B(None, "psu", "led", (x + 0.3, FRONT - 0.01, z + 0.47), (0.05, 0.02, 0.04), "sig_green", tier, bev=0)
    B(None, "power-shelf", "busbar_clip", (0, D / 2 - 0.2, z + 0.3), (5.6, 0.3, 0.3), "copper", tier, bev=0.02)


def tor_switch(z, tier):
    chassis("tor-switch", z, tier)
    B(None, "tor-switch", "board", (0, -0.5, z + 0.08), (5.6, 6.0, 0.05), "pcb_green", tier, bev=0)
    B(None, "tor-switch", "asic", (0, 0, z + 0.15), (1.4, 1.4, 0.08), "nickel", tier, bev=0.02)
    fins = [B(None, "tor-switch", "fin", (-0.9 + k * 0.15, 0, z + 0.38), (0.05, 1.8, 0.4), "aluminum", tier, bev=0) for k in range(13)]
    join(fins, nm("tor-switch", "heatsink", tier))
    # Pluggable: 32 OSFP modules in the front cages, fibers out of each
    mods, fibers = [], []
    for k in range(32):
        x = -2.7 + (k % 16) * 0.36
        zz = z + 0.15 + (k // 16) * 0.22
        mods.append(B(None, "optical-module", "osfp", (x, FRONT + 0.4, zz), (0.3, 1.4, 0.18), "steel", tier, bev=0.02, variant="pluggable"))
        mods.append(B(None, "optical-module", "tab", (x, FRONT - 0.4, zz), (0.12, 0.25, 0.05), "led_blue", tier, bev=0, variant="pluggable"))
        fibers.append(S(None, "fiber-cable", "fiber", [(x, FRONT - 0.3, zz), (x, FRONT - 1.0, zz + 0.1), (x * 0.6, FRONT - 1.4, zz + 1.2)], 0.025, 0.025, "fiber", tier, segments=6, variant="pluggable"))
    join(mods, nm("optical-module", "osfp", tier, "pluggable"))
    join(fibers, nm("fiber-cable", "fibers", tier, "pluggable"))
    # CPO: optical engines around the switch ASIC, fiber ribbons to front MPO ports
    engines, ribbons, ports = [], [], []
    spots = [(-1.15, -0.6), (-1.15, 0.6), (1.15, -0.6), (1.15, 0.6), (-0.55, -1.15), (0.55, -1.15), (-0.55, 1.15), (0.55, 1.15)]
    for k, (x, y) in enumerate(spots):
        engines.append(B(None, "optical-module", "engine", (x, y, z + 0.14), (0.42, 0.42, 0.08), "gold", tier, bev=0.01, variant="cpo"))
        px = -2.45 + k * 0.7
        ribbons.append(S(None, "fiber-cable", "ribbon", [(x, y, z + 0.2), (x, y - 0.6 if y < 0 else y + 0.3, z + 0.3), (px, FRONT + 0.6, z + 0.28), (px, FRONT + 0.15, z + 0.25)], 0.08, 0.015, "fiber", tier, segments=4, phase=math.pi / 4, variant="cpo"))
        ports.append(B(None, "fiber-cable", "mpo", (px, FRONT + 0.05, z + 0.25), (0.4, 0.2, 0.22), "socket", tier, bev=0.02, variant="cpo"))
    join(engines, nm("optical-module", "engines", tier, "cpo"))
    join(ribbons, nm("fiber-cable", "ribbons", tier, "cpo"))
    join(ports, nm("fiber-cable", "mpo_ports", tier, "cpo"))


def frame(height):
    posts = []
    for x in (-W / 2 - 0.25, W / 2 + 0.25):
        for y in (FRONT - 0.3, D / 2 + 0.5):
            posts.append(B(None, "rack-frame", "post", (x, y, height / 2), (0.2, 0.2, height), "black_metal", bev=0.02))
    for zz in (0.05,):  # open top so the switch tray stays visible
        posts.append(B(None, "rack-frame", "cap", (0, (FRONT + D / 2 + 0.2) / 2, zz), (W + 0.7, D + 1.0, 0.1), "black_metal", bev=0.02))
    for y in (FRONT - 0.3, D / 2 + 0.5):
        for x in (-W / 2 - 0.1, W / 2 + 0.1):
            posts.append(B(None, "rack-frame", "rail", (x, y, height / 2), (0.08, 0.08, height), "sheet", bev=0))
    join(posts, nm("rack-frame", "frame"))


def build():
    z = 0.0
    slots = [power_shelf, compute_tray, compute_tray, switch_tray, switch_tray, compute_tray, compute_tray, power_shelf, tor_switch]
    for tier, fn in enumerate(slots):
        fn(z, tier)
        z += H
    height = z + 0.3
    frame(height)
    # NVLink copper spine: bundles of twinax cables down the rear
    cables = []
    for i in range(24):
        x = -2.3 + i * 0.2
        cables.append(S(None, "nvlink-spine", "cable", [(x, D / 2 + 0.1, H * 1.2), (x, D / 2 + 0.35, H * 3.0), (x, D / 2 + 0.35, H * 5.0), (x, D / 2 + 0.1, H * 6.8)], 0.045, 0.045, "copper", segments=8))
    join(cables, nm("nvlink-spine", "cables"))
    # Cooling manifolds with quick disconnects at each tray
    for x, mat in ((-2.8, "hose_blue"), (2.8, "hose_red")):
        C(None, "cooling", "manifold", (x, D / 2 + 0.25), 0.15, 0.2, height - 0.4, "steel", segments=20)
        qd = [C(None, "cooling", "qd", (x, D / 2 + 0.05), 0.09, k * H + 0.25, k * H + 0.4, mat, segments=12) for k in range(1, 8)]
        join(qd, nm("cooling", "quick_disconnects"))
    B(None, "power-shelf", "busbar", (0, D / 2 + 0.3, height / 2), (0.5, 0.12, height - 0.4), "copper", bev=0.02)


def main(out, meta):
    m.reset_scene()
    mats()
    build()
    write_meta(meta)
    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :]
    main(argv[0], argv[1])
