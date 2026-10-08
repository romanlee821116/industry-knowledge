"""Shared helpers for procedural micro-models. Blender is Z-up; glTF export converts to Y-up."""

import math

import bpy
from mathutils import Vector


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(name, rgba, metallic=0.0, roughness=0.5, alpha=1.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "BLENDED"
    return mat


def add_object(name, verts, faces, mat, smooth=False, parent=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    mesh.update()
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def add_empty(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def box(name, center, size, mat, parent=None):
    cx, cy, cz = center
    sx, sy, sz = (s / 2 for s in size)
    verts = [
        (cx + x * sx, cy + y * sy, cz + z * sz)
        for x in (-1, 1)
        for y in (-1, 1)
        for z in (-1, 1)
    ]
    faces = [
        (0, 1, 3, 2),
        (4, 6, 7, 5),
        (0, 4, 5, 1),
        (2, 3, 7, 6),
        (0, 2, 6, 4),
        (1, 5, 7, 3),
    ]
    return add_object(name, verts, faces, mat, parent=parent)


def sweep(name, path, half_w, half_h, mat, segments=16, up_hint=Vector((0, 0, 1)), parent=None):
    """Sweep an ellipse (half_w along side, half_h along up) along a polyline, capped at both ends."""
    verts, faces = [], []
    n = len(path)
    for i, p in enumerate(path):
        t = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        side = up_hint.cross(t)
        if side.length < 1e-6:
            side = Vector((1, 0, 0)).cross(t)
        side.normalize()
        up = t.cross(side).normalized()
        for s in range(segments):
            a = 2 * math.pi * s / segments
            verts.append(p + side * (math.cos(a) * half_w) + up * (math.sin(a) * half_h))
    for i in range(n - 1):
        for s in range(segments):
            a0 = i * segments + s
            a1 = i * segments + (s + 1) % segments
            faces.append((a0, a1, a1 + segments, a0 + segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple(range((n - 1) * segments, n * segments)))
    return add_object(name, verts, faces, mat, smooth=True, parent=parent)


def _arc(segments, half):
    """Angles for a full ring, or the y>=0 half ring (for solids cut by the y=cy section plane)."""
    if half:
        return [math.pi * s / segments for s in range(segments + 1)]
    return [2 * math.pi * s / segments for s in range(segments)]


def tube(name, center, r_out, r_in, z0, z1, mat, segments=32, half=False, parent=None):
    """Hollow vertical cylinder (e.g. plated through hole barrel). half=True keeps the y>=cy half."""
    cx, cy = center
    angles = _arc(segments, half)
    n = len(angles)
    verts = []
    for z in (z0, z1):
        for r in (r_out, r_in):
            for a in angles:
                verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    faces = []
    ring = lambda k, s: k * n + (s % n)  # noqa: E731
    # rings: 0=bottom outer, 1=bottom inner, 2=top outer, 3=top inner
    for s in range(n if not half else n - 1):
        faces.append((ring(0, s), ring(0, s + 1), ring(2, s + 1), ring(2, s)))
        faces.append((ring(1, s), ring(3, s), ring(3, s + 1), ring(1, s + 1)))
        faces.append((ring(0, s), ring(1, s), ring(1, s + 1), ring(0, s + 1)))
        faces.append((ring(2, s), ring(2, s + 1), ring(3, s + 1), ring(3, s)))
    if half:
        for s in (0, n - 1):  # cut faces on the section plane
            faces.append((ring(0, s), ring(2, s), ring(3, s), ring(1, s)))
    return add_object(name, verts, faces, mat, smooth=not half, parent=parent)


def frustum(name, center, r0, r1, z0, z1, mat, segments=24, half=False, parent=None):
    """Solid truncated cone (laser micro-via), r0 at z0, r1 at z1. half=True keeps the y>=cy half."""
    cx, cy = center
    angles = _arc(segments, half)
    n = len(angles)
    verts = []
    for r, z in ((r0, z0), (r1, z1)):
        for a in angles:
            verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    sides = n if not half else n - 1
    faces = [(s, (s + 1) % n, n + (s + 1) % n, n + s) for s in range(sides)]
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple(range(n, 2 * n)))
    if half:
        faces.append((0, n, 2 * n - 1, n - 1))  # trapezoid on the section plane
    return add_object(name, verts, faces, mat, smooth=not half, parent=parent)


def sphere(name, center, radius, mat, rings=12, segments=24, z_scale=1.0, parent=None):
    cx, cy, cz = center
    verts = [(cx, cy, cz - radius * z_scale)]
    for i in range(1, rings):
        phi = math.pi * i / rings - math.pi / 2
        for s in range(segments):
            a = 2 * math.pi * s / segments
            verts.append(
                (
                    cx + radius * math.cos(phi) * math.cos(a),
                    cy + radius * math.cos(phi) * math.sin(a),
                    cz + radius * math.sin(phi) * z_scale,
                )
            )
    verts.append((cx, cy, cz + radius * z_scale))
    top = len(verts) - 1
    faces = []
    for s in range(segments):
        faces.append((0, 1 + (s + 1) % segments, 1 + s))
    for i in range(rings - 2):
        for s in range(segments):
            a = 1 + i * segments + s
            b = 1 + i * segments + (s + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    base = 1 + (rings - 2) * segments
    for s in range(segments):
        faces.append((base + s, base + (s + 1) % segments, top))
    return add_object(name, verts, faces, mat, smooth=True, parent=parent)


def export_glb(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, export_apply=True)
