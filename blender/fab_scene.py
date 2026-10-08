"""Fab floor scene: 8 process tools around an aisle, OHT rail above the load ports, raised floor.

Run: Blender --background --python fab_scene.py -- <out.glb> <meta.json>

Mesh naming read by the web app:  <layerId>__<part>[__e<k>]
  - layerId maps the mesh to a knowledge card / highlight group
  - __e<k> lifts the mesh k explode-steps when the viewer explodes the scene
  - meshes without "__" are decor (floor), never interactive
meta.json holds per-layer world bounds (glTF Y-up) for camera focus and labels.
"""

import json
import math
import os
import sys

sys.path.append(os.path.dirname(__file__))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import lib_mesh as m  # noqa: E402

RX, RZ = 15.0, 10.0  # station ellipse (in web/R3F x–z, +z toward the viewer)
RAIL_INSET = 2.7
RAIL_Z = 3.9

_count = {"n": 0}


def nm(layer, part, tier=0):
    _count["n"] += 1
    return f"{layer}__{part}{_count['n']}" + (f"__e{tier}" if tier else "")


# ---------------------------------------------------------------- materials
M = {}


def mats():
    M["panel"] = m.material("panel", (0.78, 0.79, 0.78, 1), roughness=0.42)
    M["panel_alt"] = m.material("panel_alt", (0.66, 0.69, 0.72, 1), roughness=0.45)
    M["trim"] = m.material("trim", (0.42, 0.45, 0.5, 1), metallic=0.3, roughness=0.45)
    M["dark"] = m.material("dark", (0.1, 0.11, 0.13, 1), roughness=0.4)
    M["screen"] = m.material("screen", (0.03, 0.05, 0.08, 1), roughness=0.12, emission=(0.1, 0.35, 0.7), strength=0.8)
    M["glass"] = m.material("glass", (0.75, 0.85, 0.95, 1), roughness=0.05, alpha=0.22)
    M["amber_glass"] = m.material("amber_glass", (1.0, 0.82, 0.35, 1), roughness=0.05, alpha=0.3)
    M["steel"] = m.material("steel", (0.78, 0.8, 0.83, 1), metallic=0.9, roughness=0.28)
    M["liquid"] = m.material("liquid", (0.25, 0.6, 0.95, 1), roughness=0.05, alpha=0.6)
    M["foup"] = m.material("foup", (0.3, 0.33, 0.37, 1), roughness=0.3, alpha=0.82)
    M["foup_door"] = m.material("foup_door", (0.16, 0.17, 0.2, 1), roughness=0.35)
    M["copper"] = m.material("copper", (0.85, 0.47, 0.27, 1), metallic=1.0, roughness=0.3)
    M["quartz"] = m.material("quartz", (0.85, 0.92, 0.98, 1), roughness=0.05, alpha=0.55)
    M["pad"] = m.material("pad", (0.14, 0.14, 0.16, 1), roughness=0.85)
    M["diamond"] = m.material("diamond", (0.82, 0.84, 0.88, 1), metallic=0.7, roughness=0.25)
    M["slurry"] = m.material("slurry", (0.92, 0.92, 0.85, 1), roughness=0.2)
    M["plasma"] = m.material("plasma", (0.7, 0.4, 1.0, 1), alpha=0.75, emission=(0.65, 0.35, 1.0), strength=6)
    M["green"] = m.material("sig_green", (0.2, 0.9, 0.3, 1), emission=(0.2, 1, 0.3), strength=3)
    M["yellow"] = m.material("sig_yellow", (1, 0.85, 0.2, 1), emission=(1, 0.8, 0.1), strength=1)
    M["red"] = m.material("sig_red", (0.9, 0.2, 0.2, 1), emission=(1, 0.1, 0.1), strength=0.5)
    M["arrow"] = m.material("arrow", (1.0, 0.62, 0.12, 1), emission=(1.0, 0.55, 0.08), strength=1.5)
    M["floor"] = m.material("floor", (0.36, 0.38, 0.41, 1), roughness=0.8)
    M["floor_gap"] = m.material("floor_gap", (0.2, 0.21, 0.23, 1), roughness=0.9)
    M["silicon"] = m.material("silicon", (0.33, 0.36, 0.5, 1), metallic=0.4, roughness=0.18)
    M["die"] = m.material("die", (0.42, 0.5, 0.72, 1), metallic=0.5, roughness=0.15)


# ---------------------------------------------------------------- helpers
def B(P, layer, part, center, size, mat, tier=0, bev=0.02):
    obj = m.box(nm(layer, part, tier), center, size, mat, parent=P)
    if bev:
        m.bevel(obj, min(bev, min(size) / 3))
    return obj


def C(P, layer, part, center, r, z0, z1, mat, tier=0, segments=32, r_top=None):
    return m.frustum(nm(layer, part, tier), center, r, r if r_top is None else r_top, z0, z1, mat, segments=segments, parent=P)


def paneled(P, layer, cx, cy, w, d, h, cols, mat="panel", z0=0.0):
    """Cabinet built from vertical panels with thin seams + a dark kick plate."""
    B(P, layer, "kick", (cx, cy, z0 + 0.06), (w - 0.04, d - 0.04, 0.12), M["dark"], bev=0)
    pw = w / cols
    for k in range(cols):
        x = cx - w / 2 + pw * (k + 0.5)
        B(P, layer, "panel", (x, cy, z0 + 0.12 + (h - 0.12) / 2), (pw - 0.018, d, h - 0.12), M[mat], bev=0.025)


def screen(P, layer, x, y, z, w=0.5, h=0.34):
    B(P, layer, "screen_frame", (x, y - 0.03, z), (w + 0.06, 0.05, h + 0.06), M["trim"], bev=0.01)
    B(P, layer, "screen", (x, y - 0.06, z), (w, 0.02, h), M["screen"], bev=0)


def tower(P, layer, x, y, z):
    C(P, layer, "tower_pole", (x, y), 0.02, z, z + 0.2, M["steel"], segments=10)
    for k, col in enumerate(("green", "yellow", "red")):
        C(P, layer, f"tower_{col}", (x, y), 0.055, z + 0.2 + k * 0.09, z + 0.28 + k * 0.09, M[col], segments=16)


def foup(P, x, y, z, tier=0):
    """FOUP: 25-wafer pod with front door and OHT grip flange."""
    B(P, "foup", "body", (x, y, z + 0.19), (0.46, 0.44, 0.38), M["foup"], tier, bev=0.05)
    B(P, "foup", "door", (x, y - 0.225, z + 0.19), (0.42, 0.02, 0.34), M["foup_door"], tier, bev=0.01)
    B(P, "foup", "flange", (x, y, z + 0.41), (0.22, 0.22, 0.05), M["foup_door"], tier, bev=0.01)


def load_ports(P, layer, xs, y):
    for x in xs:
        B(P, layer, "loadport", (x, y, 0.45), (0.56, 0.36, 0.9), M["panel_alt"], bev=0.02)
        B(P, layer, "loadport_plate", (x, y - 0.02, 0.92), (0.5, 0.42, 0.04), M["trim"], bev=0.01)
        foup(P, x, y - 0.02, 0.94)


def station(index, count=8):
    a = math.pi / 2 + index * 2 * math.pi / count
    x, z = RX * math.cos(a), RZ * math.sin(a)
    bx, by = x, -z  # glTF z -> Blender -y
    P = m.add_empty(f"station_{index}")
    P.location = (bx, by, 0)
    # local -Y (tool front) faces the aisle centre
    dx, dy = -bx, -by
    P.rotation_euler = (0, 0, math.atan2(dx, -dy))
    return P


def chamber(P, layer, cx, cy, tier_top=0, plasma=False, lid_extra=None):
    B(P, layer, "frame", (cx, cy, 0.45), (0.9, 0.9, 0.9), M["trim"], bev=0.02)
    if plasma:
        C(P, layer, "body_low", (cx, cy), 0.5, 0.9, 1.15, M["steel"])
        C(P, layer, "viewport", (cx, cy), 0.5, 1.15, 1.45, M["glass"])
        C(P, layer, "plasma", (cx, cy), 0.38, 1.2, 1.4, M["plasma"], segments=24)
        C(P, layer, "body_high", (cx, cy), 0.5, 1.45, 1.6, M["steel"])
    else:
        C(P, layer, "body", (cx, cy), 0.5, 0.9, 1.6, M["steel"])
    C(P, layer, "lid", (cx, cy), 0.54, 1.6, 1.72, M["panel"], tier_top)
    if lid_extra:
        lid_extra(cx, cy)


def pump(P, x, y):
    B(P, "vacuum-pump", "pump", (x, y, 0.3), (0.5, 0.75, 0.6), M["panel_alt"], bev=0.03)
    C(P, "vacuum-pump", "motor", (x, y + 0.42), 0.16, 0.15, 0.45, M["trim"], segments=20)


# ---------------------------------------------------------------- tools
def build_stocker(P):
    w, d, h = 3.2, 1.6, 3.2
    paneled(P, "amhs", 0, 0, w, d, h, 4, "panel")
    B(P, "amhs", "window", (0, -d / 2 - 0.01, 1.85), (2.7, 0.02, 2.3), M["glass"], bev=0)
    for lv in range(4):
        z = 0.75 + lv * 0.62
        B(P, "amhs", "shelf", (0, -0.1, z), (2.6, 1.0, 0.03), M["steel"], bev=0)
        for k in range(4):
            foup(P, -0.95 + k * 0.63, -0.1, z + 0.02)
    load_ports(P, "amhs", (-0.7, 0.7), -d / 2 - 0.25)
    tower(P, "amhs", w / 2 - 0.2, d / 2 - 0.2, h)
    # Showcase wafer on a pedestal beside the stocker
    C(P, "fab-wafer", "pedestal", (2.5, -0.6), 0.32, 0, 0.95, M["trim"])
    C(P, "fab-wafer", "wafer", (2.5, -0.6), 0.75, 1.0, 1.02, M["silicon"], tier=1, segments=64)
    tiles = []
    pitch, s = 0.12, 0.105
    for i in range(-6, 7):
        for j in range(-6, 7):
            if math.hypot(i * pitch, j * pitch) < 0.68:
                tiles.append((2.5 + i * pitch, -0.6 + j * pitch))
    verts, faces = [], []
    for x, y in tiles:
        n = len(verts)
        verts += [(x - s / 2, y - s / 2, 1.022), (x + s / 2, y - s / 2, 1.022), (x + s / 2, y + s / 2, 1.022), (x - s / 2, y + s / 2, 1.022)]
        faces.append((n, n + 1, n + 2, n + 3))
    m.add_object(nm("fab-wafer", "dies", 1), verts, faces, M["die"], parent=P)


def build_wet(P):
    w, d, h = 5.6, 1.8, 2.2
    paneled(P, "wet-bench", 0, 0, w, d, h, 6)
    B(P, "wet-bench", "sash", (0.3, -d / 2 - 0.01, 1.45), (4.6, 0.02, 1.0), M["glass"], bev=0)
    for k in range(4):
        x = -1.5 + k * 1.15
        B(P, "wet-bench", "tank", (x, -0.3, 1.1), (0.9, 0.8, 0.4), M["liquid"], bev=0.02)
    B(P, "wet-bench", "robot_rail", (0.3, -0.75, 1.75), (4.4, 0.08, 0.08), M["steel"], bev=0)
    for x in (-1.8, 1.8):
        C(P, "wet-bench", "exhaust", (x, 0.4), 0.18, h, h + 0.8, M["steel"], segments=20)
    m.sweep(nm("wet-bench", "duct"), [Vector((-1.8, 0.4, h + 0.8)), Vector((1.8, 0.4, h + 0.8))], 0.18, 0.18, M["steel"], parent=P)
    load_ports(P, "wet-bench", (-2.35, -1.75), -d / 2 - 0.25)
    screen(P, "wet-bench", 2.4, -d / 2, 1.35)
    tower(P, "wet-bench", w / 2 - 0.2, d / 2 - 0.2, h)
    # Chemical supply tanks behind the bench
    for k, x in enumerate((-1.2, 0.2)):
        C(P, "chem-supply", "tank", (x, 1.9), 0.42, 0, 1.6, M["panel"], segments=28)
        m.sphere(nm("chem-supply", "dome"), (x, 1.9, 1.6), 0.42, M["panel"], z_scale=0.4, parent=P)
        m.sweep(nm("chem-supply", "pipe"), [Vector((x, 1.9, 1.9)), Vector((x, 1.2, 2.3)), Vector((x + 0.4, 0.9, 2.3))], 0.04, 0.04, M["steel"], segments=10, parent=P)


def build_cluster(P, layer, chambers, efem_ports=3, etch=False):
    # EFEM + load locks + hexagonal transfer chamber
    paneled(P, layer, 0, -1.3, 2.8, 1.0, 2.1, 3)
    B(P, layer, "efem_window", (0, -1.81, 1.4), (2.3, 0.02, 0.9), M["glass"], bev=0)
    load_ports(P, layer, [(-0.9 + k * 0.9) for k in range(efem_ports)], -2.05)
    for x in (-0.45, 0.45):
        B(P, layer, "loadlock", (x, -0.55, 1.2), (0.6, 0.5, 0.6), M["steel"], bev=0.03)
    B(P, layer, "tm_frame", (0, 0.6, 0.45), (2.0, 2.0, 0.9), M["trim"], bev=0.03)
    C(P, layer, "transfer", (0, 0.6), 1.0, 0.9, 1.5, M["steel"], segments=6)
    C(P, layer, "transfer_lid", (0, 0.6), 1.02, 1.5, 1.58, M["panel"], segments=6)
    tower(P, layer, 1.2, -0.9, 2.1)
    screen(P, layer, 1.0, -1.8, 1.4, w=0.4, h=0.28)
    for ang, ch_layer, kind in chambers:
        a = math.radians(ang)
        cx, cy = 1.75 * math.sin(a), 0.6 + 1.75 * math.cos(a)

        def extra(cx=cx, cy=cy, kind=kind, ch_layer=ch_layer):
            if kind == "pvd":
                B(P, ch_layer, "magnetron", (cx, cy, 1.85), (0.5, 0.5, 0.25), M["trim"], bev=0.03)
                C(P, "sputter-target", "target", (cx, cy), 0.42, 2.05, 2.11, M["copper"], tier=1, segments=48)
            elif kind == "rf":
                B(P, ch_layer, "rf_match", (cx, cy, 1.9), (0.45, 0.6, 0.35), M["dark"], bev=0.03)
                C(P, ch_layer, "rf_coil", (cx, cy), 0.22, 1.72, 1.78, M["copper"], segments=24)
            else:
                C(P, ch_layer, "showerhead", (cx, cy), 0.25, 1.72, 1.86, M["trim"], segments=24)
                m.sweep(nm(ch_layer, "gasline"), [Vector((cx, cy, 1.86)), Vector((cx, cy, 2.1)), Vector((cx * 1.4, cy, 2.1))], 0.03, 0.03, M["steel"], segments=8, parent=P)

        chamber(P, ch_layer, cx, cy, plasma=etch and kind == "rf", lid_extra=extra)
        pump(P, cx * 1.55, 0.6 + (cy - 0.6) * 1.55)


def build_deposition(P):
    build_cluster(P, "deposition-tool", [(-62, "pvd-chamber", "pvd"), (0, "cvd-chamber", "cvd"), (62, "ald-chamber", "ald")])
    # Specialty gas cabinet beside the tool
    B(P, "gas-cabinet", "cabinet", (-2.4, 1.2, 1.2), (0.9, 0.75, 2.4), M["panel"], bev=0.03)
    B(P, "gas-cabinet", "door_glass", (-2.4, 0.82, 1.4), (0.6, 0.02, 1.4), M["glass"], bev=0)
    for k, x in enumerate((-2.58, -2.22)):
        C(P, "gas-cabinet", "cylinder", (x, 1.2), 0.13, 0.2, 1.9, M["steel"], segments=20)
        m.sphere(nm("gas-cabinet", "cyl_top"), (x, 1.2, 1.9), 0.13, M["steel"], z_scale=0.6, parent=P)
    m.sweep(nm("gas-cabinet", "gasline"), [Vector((-2.4, 1.2, 2.4)), Vector((-2.4, 1.2, 2.7)), Vector((-1.0, 1.0, 2.7)), Vector((-0.6, 1.4, 2.2))], 0.035, 0.035, M["steel"], segments=8, parent=P)


def build_track(P):
    w, d, h = 4.8, 1.8, 2.0
    paneled(P, "coater-track", 0, 0, w, d, h, 5)
    B(P, "coater-track", "window", (-0.3, -d / 2 - 0.01, 1.3), (3.4, 0.02, 0.7), M["amber_glass"], bev=0)
    for k in range(3):
        x = -1.5 + k * 1.1
        C(P, "coater-track", "spin_cup", (x, -0.3), 0.33, 1.0, 1.25, M["dark"], segments=32)
        C(P, "coater-track", "spin_wafer", (x, -0.3), 0.26, 1.2, 1.215, M["silicon"], segments=40)
    for k in range(5):
        B(P, "coater-track", "hotplate", (1.8, -0.2, 0.9 + k * 0.18), (0.8, 0.9, 0.12), M["trim"], bev=0.015)
    load_ports(P, "coater-track", (-1.8, -1.0), -d / 2 - 0.25)
    screen(P, "coater-track", 1.8, -d / 2, 1.5)
    tower(P, "coater-track", w / 2 - 0.2, d / 2 - 0.2, h)


def build_scanner(P):
    w, d, h = 6.6, 3.0, 2.8
    paneled(P, "litho-scanner", -0.6, 0, w, d, h, 6)
    for k in range(3):
        B(P, "litho-scanner", "service_panel", (-2.6 + k * 1.3, -d / 2 - 0.01, 1.2), (1.0, 0.02, 1.6), M["panel_alt"], bev=0.01)
    screen(P, "litho-scanner", 1.6, -d / 2, 1.5, w=0.6, h=0.4)
    tower(P, "litho-scanner", 2.4, -d / 2 + 0.2, h)
    # EUV light source module (tin-droplet plasma vessel)
    B(P, "litho-scanner", "source", (3.7, 0.3, 1.25), (1.8, 2.3, 2.5), M["panel"], bev=0.04)
    C(P, "litho-scanner", "source_vessel", (3.7, 0.3), 0.55, 2.5, 3.0, M["steel"], segments=28)
    # Reticle stage opening on top; reticle and pellicle lift out when exploded
    B(P, "litho-scanner", "reticle_stage", (-0.6, 0, h + 0.03), (1.4, 1.4, 0.06), M["dark"], bev=0.01)
    B(P, "reticle", "reticle", (-0.6, 0, h + 0.12), (0.62, 0.62, 0.05), M["quartz"], tier=1, bev=0.005)
    for dx, dy, sx, sy in ((0, 0.3, 0.62, 0.03), (0, -0.3, 0.62, 0.03), (0.3, 0, 0.03, 0.62), (-0.3, 0, 0.03, 0.62)):
        B(P, "pellicle", "frame", (-0.6 + dx, dy, h + 0.22), (sx, sy, 0.04), M["trim"], tier=2, bev=0)
    B(P, "pellicle", "membrane", (-0.6, 0, h + 0.24), (0.58, 0.58, 0.004), M["glass"], tier=2, bev=0)


def build_etch(P):
    build_cluster(P, "etch-tool", [(-75, "etch-tool", "rf"), (-25, "etch-tool", "rf"), (25, "etch-tool", "rf"), (75, "etch-tool", "rf")], etch=True)


def build_cmp(P):
    w, d = 5.0, 3.0
    paneled(P, "cmp-tool", 0, 0, w, d, 1.0, 5)
    for x in (-w / 2 + 0.05, w / 2 - 0.05):
        for y in (-d / 2 + 0.05, d / 2 - 0.05):
            B(P, "cmp-tool", "post", (x, y, 1.65), (0.08, 0.08, 1.3), M["steel"], bev=0)
    B(P, "cmp-tool", "roof", (0, 0, 2.35), (w, d, 0.1), M["panel"], bev=0.02)
    B(P, "cmp-tool", "glass_front", (0, -d / 2, 1.65), (w - 0.1, 0.02, 1.3), M["glass"], bev=0)
    B(P, "cmp-tool", "glass_side", (w / 2, 0, 1.65), (0.02, d - 0.1, 1.3), M["glass"], bev=0)
    platens = [(-1.3, 0.35), (0.0, 0.75), (1.3, 0.35)]
    for k, (x, y) in enumerate(platens):
        C(P, "cmp-tool", "platen", (x, y), 0.56, 1.0, 1.14, M["steel"], segments=48)
        C(P, "cmp-pad", "pad", (x, y), 0.54, 1.14, 1.17, M["pad"], tier=1, segments=48)
        # carrier heads on the carousel
        C(P, "cmp-tool", "head", (x + 0.15, y - 0.1), 0.22, 1.22, 1.36, M["trim"], tier=2, segments=32)
        m.sweep(nm("cmp-tool", "spindle", 2), [Vector((x + 0.15, y - 0.1, 1.36)), Vector((x + 0.15, y - 0.1, 1.85))], 0.05, 0.05, M["steel"], segments=12, parent=P)
        # pad conditioner arm + diamond disk
        m.sweep(nm("pad-conditioner", "arm", 2), [Vector((x - 0.75, y + 0.35, 1.32)), Vector((x - 0.25, y + 0.2, 1.32))], 0.04, 0.03, M["trim"], segments=4, phase=math.pi / 4, parent=P)
        C(P, "pad-conditioner", "disk", (x - 0.25, y + 0.2), 0.1, 1.2, 1.28, M["diamond"], tier=2, segments=24)
        # slurry dispense arm
        m.sweep(nm("cmp-slurry", "arm", 2), [Vector((x + 0.7, y + 0.5, 1.45)), Vector((x + 0.1, y + 0.15, 1.3))], 0.025, 0.025, M["liquid"], segments=10, parent=P)
    B(P, "cmp-tool", "carousel_hub", (0, 0.45, 1.95), (0.5, 0.5, 0.25), M["trim"], tier=2, bev=0.03)
    for x, y in platens:
        m.sweep(nm("cmp-tool", "carousel_arm", 2), [Vector((0, 0.45, 1.9)), Vector((x + 0.15, y - 0.1, 1.9))], 0.06, 0.04, M["trim"], segments=4, phase=math.pi / 4, parent=P)
    # cleaner module + load ports
    B(P, "cmp-tool", "cleaner", (-1.6, -1.0, 1.4), (1.6, 0.8, 0.8), M["panel_alt"], bev=0.03)
    load_ports(P, "cmp-tool", (-0.6, 0.3, 1.2), -d / 2 - 0.25)
    tower(P, "cmp-tool", w / 2 - 0.2, d / 2 - 0.2, 2.4)


def build_inspection(P):
    w, d, h = 3.0, 2.2, 2.0
    paneled(P, "inspection-tool", 0, 0, w, d, h, 3)
    B(P, "inspection-tool", "window", (0.2, -d / 2 - 0.01, 1.35), (1.6, 0.02, 0.6), M["glass"], bev=0)
    for k, (r, z0, z1) in enumerate(((0.32, 2.0, 2.35), (0.24, 2.35, 2.75), (0.15, 2.75, 3.0))):
        C(P, "inspection-tool", "column", (0.2, 0.2), r, z0, z1, M["panel"] if k != 1 else M["trim"], segments=28)
    load_ports(P, "inspection-tool", (-1.0,), -d / 2 - 0.25)
    screen(P, "inspection-tool", 1.0, -d / 2, 1.0)
    tower(P, "inspection-tool", w / 2 - 0.2, d / 2 - 0.2, h)


# ---------------------------------------------------------------- shared infrastructure
def ellipse(rx, rz, n, z=0.0):
    pts = []
    for k in range(n + 1):
        a = k / n * 2 * math.pi
        pts.append(Vector((rx * math.cos(a), -rz * math.sin(a), z)))
    return pts


def build_amhs():
    P = m.add_empty("amhs_root")
    rx, rz = RX - RAIL_INSET, RZ - RAIL_INSET
    m.sweep(nm("amhs", "rail"), ellipse(rx, rz, 180, RAIL_Z), 0.09, 0.07, M["trim"], segments=4, phase=math.pi / 4, parent=P)
    for k in range(18):
        a = k / 18 * 2 * math.pi
        x, y = rx * math.cos(a), -rz * math.sin(a)
        m.frustum(nm("amhs", "hanger"), (x, y), 0.025, 0.025, RAIL_Z + 0.05, RAIL_Z + 0.9, M["steel"], segments=8, parent=P)
    for a_deg in (25, 160, 250):
        a = math.radians(a_deg)
        x, y = rx * math.cos(a), -rz * math.sin(a)
        V = m.add_empty(f"oht_{a_deg}")
        V.parent = P
        V.location = (x, y, 0)
        V.rotation_euler = (0, 0, math.atan2(-rz * math.cos(a), -rx * math.sin(a)))
        B(V, "amhs", "vehicle", (0, 0, RAIL_Z - 0.32), (0.85, 0.55, 0.5), M["panel"], bev=0.04)
        B(V, "amhs", "vehicle_band", (0, 0, RAIL_Z - 0.5), (0.87, 0.57, 0.08), M["dark"], bev=0.01)
        B(V, "amhs", "gripper", (0, 0, RAIL_Z - 0.62), (0.3, 0.3, 0.12), M["trim"], bev=0.01)
        foup(V, 0, 0, RAIL_Z - 1.1)


def build_flow():
    rx, rz = RX - 6, RZ - 5
    verts, faces = [], []
    n = 32
    for k in range(n):
        a = k / n * 2 * math.pi
        p = Vector((rx * math.cos(a), -rz * math.sin(a), 0.02))
        t = Vector((-rx * math.sin(a), -rz * math.cos(a), 0)).normalized()  # direction of increasing station index
        nrm = Vector((-t.y, t.x, 0))
        base = len(verts)
        verts += [p + t * 0.4, p - t * 0.25 + nrm * 0.3, p - t * 0.05, p - t * 0.25 - nrm * 0.3]
        faces.append((base, base + 1, base + 2, base + 3))
    m.add_object("process-flow__arrows", verts, faces, M["arrow"])


def build_floor():
    tile, gap = 1.2, 0.035
    verts, faces = [], []
    for i in range(-18, 18):
        for j in range(-13, 13):
            x0, y0 = i * tile + gap, j * tile + gap
            x1, y1 = x0 + tile - 2 * gap, y0 + tile - 2 * gap
            n = len(verts)
            verts += [(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0)]
            faces.append((n, n + 1, n + 2, n + 3))
    m.add_object("floor_tiles", verts, faces, M["floor"])
    m.box("floor_base", (0, 0, -0.03), (43.2, 31.2, 0.05), M["floor_gap"])


# ---------------------------------------------------------------- meta
def write_meta(path):
    bpy.context.view_layer.update()
    bounds = {}
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or "__" not in obj.name:
            continue
        layer = obj.name.split("__")[0]
        for c in obj.bound_box:
            w = obj.matrix_world @ Vector(c)
            g = (w.x, w.z, -w.y)  # Blender Z-up -> glTF Y-up
            lo, hi = bounds.setdefault(layer, [list(g), list(g)])
            for a in range(3):
                lo[a] = min(lo[a], g[a])
                hi[a] = max(hi[a], g[a])
    out = {
        layer: {
            "center": [round((lo[a] + hi[a]) / 2, 3) for a in range(3)],
            "size": [round(hi[a] - lo[a], 3) for a in range(3)],
        }
        for layer, (lo, hi) in sorted(bounds.items())
    }
    with open(path, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(out, meta):
    m.reset_scene()
    mats()
    builders = [build_stocker, build_wet, build_deposition, build_track, build_scanner, build_etch, build_cmp, build_inspection]
    for i, build in enumerate(builders):
        build(station(i))
    build_amhs()
    build_flow()
    build_floor()
    write_meta(meta)
    m.export_glb(out)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1 :]
    main(argv[0], argv[1])
