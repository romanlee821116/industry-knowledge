"""CoWoS AI GPU package on its module board, bottom → top (one explode tier per layer):
PCB(0) → BGA(1) → solder mask(2) → ABF build-up(3) → core(4) → ABF build-up(5) → solder mask + stiffener + caps(6)
→ C4 + underfill(7) → interposer S/R/L(8) → µbumps(9) → GPU + HBM(10) → lid + TIM(11)

Run: Blender --background --python package_scene.py -- <out.glb> <meta.json>
"""

import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

import lib_mesh as m  # noqa: E402
from lib_scene import B, C, M, bus, join, mats, nm, traces, write_meta  # noqa: E402

SUB = 12.0
IP_W, IP_D = 8.0, 6.0
GPU_X = (-1.3, 1.3)
DIE_W, DIE_D = 2.4, 3.4
HBM_X = (-3.3, 3.3)
HBM_Y = (-2.1, -0.7, 0.7, 2.1)


def grid(cols, rows, w, d, cx=0.0, cy=0.0):
    for i in range(cols):
        for j in range(rows):
            yield (cx - w / 2 + w * i / max(cols - 1, 1), cy - d / 2 + d * j / max(rows - 1, 1))


def layered(layer, part, tier, z0, total, n, w, d, dielectric, variant=None):
    """Build-up stack: dielectric slabs with copper planes whose edges show on the side."""
    t = total / n
    objs = []
    for k in range(n):
        objs.append(B(None, layer, f"{part}_d", (0, 0, z0 + k * t + t / 2), (w, d, t - 0.012), dielectric, tier, bev=0, variant=variant))
        objs.append(B(None, layer, f"{part}_cu", (0, 0, z0 + (k + 1) * t - 0.006), (w + 0.004, d + 0.004, 0.012), "copper", tier, bev=0, variant=variant))
    return join(objs, nm(layer, part, tier, variant))


def build():
    z = 0.0
    # ---------------- PCB (tier 0)
    pcb_t = 0.7
    layered("server-pcb", "board", 0, z, pcb_t - 0.03, 6, 24, 20, "pcb_edge")
    B(None, "server-pcb", "mask", (0, 0, pcb_t - 0.015), (24, 20, 0.03), "mask_green", bev=0)
    pads = [B(None, "server-pcb", "pad", (x, y, pcb_t + 0.004), (0.36, 0.36, 0.008), "gold", bev=0) for x, y in grid(13, 13, 11, 11)]
    join(pads, nm("server-pcb", "pads"))
    # Signal fan-out from the BGA field toward the board edges (high-speed lanes), power pour under the VRM row
    routes = []
    for c in (-3.0, 0.0, 3.0):
        routes += bus((5.9, c), (1, 0), 8, 0.2, 0.8, 0.9, 5.6)
        routes += bus((-5.9, c), (-1, 0), 8, 0.2, 0.8, 0.9, 5.6)
        routes += bus((c, 5.9), (0, 1), 8, 0.2, 0.8, 0.9, 3.6)
    traces(None, "server-pcb", pcb_t, routes, 0.07)
    pour = [B(None, "server-pcb", "power_pour", (0, -6.6, pcb_t + 0.004), (18.0, 1.4, 0.008), "trace", bev=0),
            B(None, "server-pcb", "power_neck", (0, -5.75, pcb_t + 0.004), (10.0, 0.5, 0.008), "trace", bev=0)]
    join(pour, nm("server-pcb", "power_plane"))
    passives = []
    for k in range(28):  # decoupling MLCCs around the package
        a = k / 28 * 2 * math.pi
        x, y = 7.4 * math.cos(a), 7.4 * math.sin(a)
        passives.append(B(None, "server-pcb", "mlcc", (x, y, pcb_t + 0.08), (0.3, 0.16, 0.16), "mlcc", bev=0.02))
        passives.append(B(None, "server-pcb", "mlcc_end", (x + 0.16, y, pcb_t + 0.08), (0.04, 0.17, 0.17), "solder", bev=0))
    for i in range(8):  # VRM power stages + inductors along one edge
        x = -8 + i * 2.2
        passives.append(B(None, "server-pcb", "inductor", (x, -8.3, pcb_t + 0.35), (1.0, 1.0, 0.7), "inductor", bev=0.06))
        passives.append(B(None, "server-pcb", "power_stage", (x, -6.9, pcb_t + 0.08), (0.6, 0.5, 0.15), "mold", bev=0.02))
    join(passives, nm("server-pcb", "components"))
    z = pcb_t

    # ---------------- BGA (tier 1)
    balls = [m.sphere(nm("bga", "ball", 1), (x, y, z + 0.25), 0.28, M["solder"], rings=8, segments=14, z_scale=0.9) for x, y in grid(13, 13, 11, 11)]
    join(balls, nm("bga", "balls", 1))
    z += 0.5

    # ---------------- substrate (tiers 2–6)
    B(None, "solder-mask", "bottom", (0, 0, z + 0.03), (SUB, SUB, 0.06), "mask_green", 2, bev=0)
    z += 0.06
    layered("substrate-buildup", "bottom", 3, z, 0.3, 5, SUB, SUB, "abf")
    z += 0.3
    B(None, "substrate-core", "core", (0, 0, z + 0.225), (SUB, SUB, 0.45), "bt_core", 4, bev=0, variant="organic-core")
    B(None, "substrate-core", "glass", (0, 0, z + 0.225), (SUB, SUB, 0.45), "glass_core", 4, bev=0, variant="glass-core")
    tgv = [C(None, "substrate-core", "tgv", (x, y), 0.07, z, z + 0.45, "copper", 4, segments=10, variant="glass-core") for x, y in grid(14, 14, 10.5, 10.5)]
    join(tgv, nm("substrate-core", "tgvs", 4, "glass-core"))
    z += 0.45
    layered("substrate-buildup", "top", 5, z, 0.3, 5, SUB, SUB, "abf")
    z += 0.3
    B(None, "solder-mask", "top", (0, 0, z + 0.03), (SUB, SUB, 0.06), "mask_green", 6, bev=0)
    z += 0.06
    # stiffener ring + land-side decoupling caps sit on the substrate
    ring = []
    for cx, cy, sx, sy in ((0, 5.65, SUB, 0.7), (0, -5.65, SUB, 0.7), (5.65, 0, 0.7, SUB - 1.4), (-5.65, 0, 0.7, SUB - 1.4)):
        ring.append(B(None, "substrate", "stiffener", (cx, cy, z + 0.14), (sx, sy, 0.28), "nickel", 6, bev=0.03))
    join(ring, nm("substrate", "stiffener", 6))
    caps = []
    for x, y in list(grid(10, 2, 8.6, 7.2)) + list(grid(2, 6, 9.6, 5.0)):
        caps.append(B(None, "substrate", "cap", (x, y, z + 0.07), (0.32, 0.18, 0.14), "mlcc", 6, bev=0.02))
    join(caps, nm("substrate", "caps", 6))

    # ---------------- C4 + underfill (tier 7)
    c4 = [m.sphere(nm("c4", "bump", 7), (x, y, z + 0.11), 0.11, M["solder"], rings=6, segments=10) for x, y in grid(20, 15, IP_W - 0.4, IP_D - 0.4)]
    join(c4, nm("c4", "bumps", 7))
    B(None, "c4", "underfill", (0, 0, z + 0.11), (IP_W + 0.1, IP_D + 0.1, 0.22), "underfill", 7, bev=0)
    B(None, "c4", "fillet", (0, 0, z + 0.04), (IP_W + 0.5, IP_D + 0.5, 0.08), "underfill", 7, bev=0.04)
    z += 0.22

    # ---------------- interposer variants (tier 8)
    ip_t = 0.28
    B(None, "interposer", "si", (0, 0, z + ip_t / 2), (IP_W, IP_D, ip_t), "silicon", 8, bev=0.01, variant="cowos-s")
    for variant in ("cowos-r", "cowos-l"):
        layered("interposer", f"rdl_{variant[-1]}", 8, z, ip_t, 4, IP_W, IP_D, "rdl", variant=variant)
    bridges = [(0, -0.9), (0, 0.9)] + [(sx * 2.6, y) for sx in (-1, 1) for y in HBM_Y]
    lsi = [B(None, "interposer", "lsi", (x, y, z + ip_t - 0.04), (0.7, 0.45, 0.1), "silicon", 8, bev=0, variant="cowos-l") for x, y in bridges]
    join(lsi, nm("interposer", "lsi", 8, "cowos-l"))
    z += ip_t

    # ---------------- µbumps (tier 9)
    ub = []
    for gx in GPU_X:
        ub += [C(None, "ubump", "b", (x, y), 0.045, z, z + 0.1, "copper", 9, segments=8) for x, y in grid(12, 16, DIE_W - 0.3, DIE_D - 0.3, gx)]
    for hx in HBM_X:
        for hy in HBM_Y:
            ub += [C(None, "ubump", "b", (x, y), 0.04, z, z + 0.1, "copper", 9, segments=8) for x, y in grid(5, 5, 0.8, 0.9, hx, hy)]
    join(ub, nm("ubump", "bumps", 9))
    z += 0.1

    # ---------------- GPU dies + HBM stacks (tier 10)
    for gx in GPU_X:
        B(None, "gpu", "die", (gx, 0, z + 0.225), (DIE_W, DIE_D, 0.45), "die_back", 10, bev=0.01)
    for hx in HBM_X:
        for hy in HBM_Y:
            slices = [B(None, "hbm", "base", (hx, hy, z + 0.035), (1.1, 1.2, 0.066), "mold", 10, bev=0)]
            for k in range(1, 9):
                slices.append(B(None, "hbm", "dram", (hx, hy, z + k * 0.07 + 0.035), (1.1, 1.2, 0.062), "hbm_a" if k % 2 else "hbm_b", 10, bev=0))
            join(slices, nm("hbm", "stack", 10))
    z += 0.63

    # ---------------- lid + TIM (tier 11)
    lid_top = z + 0.15
    B(None, "lid", "tim", (0, 0, z + 0.04), (IP_W - 0.6, IP_D - 0.6, 0.06), "tim", 11, bev=0)
    B(None, "lid", "plate", (0, 0, lid_top + 0.08), (SUB - 0.2, SUB - 0.2, 0.16), "nickel", 11, bev=0.06)
    skirt_h = lid_top - 2.65
    for cx, cy, sx, sy in ((0, 5.65, SUB - 0.2, 0.5), (0, -5.65, SUB - 0.2, 0.5), (5.65, 0, 0.5, SUB - 1.2), (-5.65, 0, 0.5, SUB - 1.2)):
        B(None, "lid", "skirt", (cx, cy, 2.65 + skirt_h / 2), (sx, sy, skirt_h), "nickel", 11, bev=0.03)


def main(out, meta):
    m.reset_scene()
    mats()
    build()
    write_meta(meta)
    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :]
    main(argv[0], argv[1])
