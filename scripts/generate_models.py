#!/usr/bin/env python3
"""
generate_models.py - placeholder low-poly GLB generator (zero dependencies).
-----------------------------------------------------------------------------
Writes the eight placeholder models used by the site into public/models/:

    inventory.glb - rack with colored crates + a "selected" crate
    quote.glb     - quotation doc with prices + APPROVED badge
    order.glb     - order document (paper + folded corner + "+" badge)
    payment.glb   - coin stack + check badge (full / advance / credit)
    invoice.glb   - invoice with payment-status chips + stock-sync crate
    delivery.glb  - delivery truck (cab + cargo + wheels)
    resource.glb  - two people + clock (attendance / labor cost)
    console.glb   - backend control board (sliders, knobs, screen)

Everything is authored as faceted triangle soup (flat shading baked into
per-face normals) and written as valid glTF 2.0 binary - no numpy, no
trimesh, just the standard library. Swap any model by dropping your own
GLB with the same filename into public/models/.

Run:  python3 scripts/generate_models.py   (or: npm run models:generate)
Also emits model-preview.html at the project root - open it in a browser
to eyeball all eight assets with orbit controls.
-----------------------------------------------------------------------------
"""
import base64
import json
import math
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "models"
OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------- palette -----------------------------------
# Stage-color system ("colorful light dashboard"): vivid mains + light tints.
PAPER = "F4F2FB"
LILAC = "DCD2F2"
INK = "3A3644"
GRAY = "6B7280"
WHITE = "FFFFFF"

TEAL = "14B8A6"
TEAL_L = "99F6E4"
AMBER = "F59E0B"
AMBER_L = "FDE68A"
VIOLET = "8B5CF6"
VIOLET_L = "C4B5FD"
GREEN = "22C55E"
GREEN_L = "86EFAC"
GREEN_D = "15803D"
MINT = "A7F3D0"
BLUE = "3B82F6"
BLUE_L = "93C5FD"
ORANGE = "F97316"
ORANGE_L = "FDBA74"
PINK = "EC4899"
PINK_L = "F9A8D4"
PINK_XL = "FBCFE8"
INDIGO = "6366F1"
INDIGO_L = "A5B4FC"
INDIGO_D = "312E81"
ROSE = "F43F5E"


def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear_rgba(hex_str):
    r, g, b = (int(hex_str[i : i + 2], 16) for i in (0, 2, 4))
    return [round(srgb_to_linear(v), 5) for v in (r, g, b)] + [1.0]


# --------------------------- tiny vector math -------------------------------
def v_add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def v_sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def v_scale(a, s):
    return (a[0] * s, a[1] * s, a[2] * s)


def v_dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def v_cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def v_norm(a):
    l = math.sqrt(v_dot(a, a)) or 1.0
    return (a[0] / l, a[1] / l, a[2] / l)


def rot_matrix(rx, ry, rz):
    """Intrinsic XYZ euler (matches three.js defaults closely enough)."""
    cx, sx, cy, sy, cz, sz = (
        math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz),
    )
    # M = Rz @ Ry @ Rx
    return (
        (cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx),
        (sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx),
        (-sy, cy * sx, cy * cx),
    )


def m_apply(m, p):
    return (
        m[0][0] * p[0] + m[0][1] * p[1] + m[0][2] * p[2],
        m[1][0] * p[0] + m[1][1] * p[1] + m[1][2] * p[2],
        m[2][0] * p[0] + m[2][1] * p[1] + m[2][2] * p[2],
    )


# ------------------------ primitive triangle soup ---------------------------
# Each primitive returns a list of (p0, p1, p2, n_hint) - n_hint points
# outward; final geometric normals + winding are fixed up in `add()`.

def prim_box(w, h, d):
    x, y, z = w / 2, h / 2, d / 2
    corners = [(sx * x, sy * y, sz * z) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    quads = [
        ((5, 4, 6, 7), (1, 0, 0)),
        ((0, 1, 3, 2), (-1, 0, 0)),
        ((2, 3, 7, 6), (0, 1, 0)),
        ((1, 0, 4, 5), (0, -1, 0)),
        ((1, 5, 7, 3), (0, 0, 1)),
        ((4, 0, 2, 6), (0, 0, -1)),
    ]
    tris = []
    for (a, b, c, d2), n in quads:
        pa, pb, pc, pd = corners[a], corners[b], corners[c], corners[d2]
        tris.append((pa, pb, pc, n))
        tris.append((pa, pc, pd, n))
    return tris


def prim_cylinder(rt, rb, h, seg=10):
    tris = []
    top, bot = h / 2, -h / 2
    ring = [(math.cos(2 * math.pi * i / seg), math.sin(2 * math.pi * i / seg)) for i in range(seg)]
    for i in range(seg):
        c0, c1 = ring[i], ring[(i + 1) % seg]
        t0 = (rt * c0[0], top, rt * c0[1])
        t1 = (rt * c1[0], top, rt * c1[1])
        b0 = (rb * c0[0], bot, rb * c0[1])
        b1 = (rb * c1[0], bot, rb * c1[1])
        mid = ((c0[0] + c1[0]) / 2, 0, (c0[1] + c1[1]) / 2)
        tris.append((t0, b0, b1, mid))
        if rt > 1e-6:
            tris.append((t0, b1, t1, mid))
    if rt > 1e-6:
        for i in range(seg):
            c0, c1 = ring[i], ring[(i + 1) % seg]
            tris.append(((0, top, 0), (rt * c0[0], top, rt * c0[1]), (rt * c1[0], top, rt * c1[1]), (0, 1, 0)))
    if rb > 1e-6:
        for i in range(seg):
            c0, c1 = ring[i], ring[(i + 1) % seg]
            tris.append(((0, bot, 0), (rb * c1[0], bot, rb * c1[1]), (rb * c0[0], bot, rb * c0[1]), (0, -1, 0)))
    return tris


def prim_icosahedron(r):
    t = (1 + math.sqrt(5)) / 2
    verts = [
        (-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0),
        (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
        (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1),
    ]
    verts = [v_scale(v_norm(v), r) for v in verts]
    faces = [
        (0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11),
        (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
        (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9),
        (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1),
    ]
    tris = []
    for a, b, c in faces:
        pa, pb, pc = verts[a], verts[b], verts[c]
        centroid = v_scale(v_add(v_add(pa, pb), pc), 1 / 3)
        tris.append((pa, pb, pc, centroid))
    return tris


def prim_torus(R, r, radial=6, tubular=12):
    """Ring around the Z axis (like three.js TorusGeometry)."""
    tris = []
    for i in range(tubular):
        for j in range(radial):
            u0, u1 = 2 * math.pi * i / tubular, 2 * math.pi * (i + 1) / tubular
            w0, w1 = 2 * math.pi * j / radial, 2 * math.pi * (j + 1) / radial

            def pt(u, w):
                return (
                    (R + r * math.cos(w)) * math.cos(u),
                    (R + r * math.cos(w)) * math.sin(u),
                    r * math.sin(w),
                )

            p00, p10, p11, p01 = pt(u0, w0), pt(u1, w0), pt(u1, w1), pt(u0, w1)
            um = (u0 + u1) / 2
            ring_center = (R * math.cos(um), R * math.sin(um), 0)
            face_mid = v_scale(v_add(v_add(p00, p10), v_add(p11, p01)), 0.25)
            n_hint = v_sub(face_mid, ring_center)
            tris.append((p00, p10, p11, n_hint))
            tris.append((p00, p11, p01, n_hint))
    return tris


# ------------------------------ model builder -------------------------------
class Model:
    def __init__(self):
        self.groups = {}  # color -> list of (p0,p1,p2,n)

    def add(self, tris, color, pos=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
        m = rot_matrix(*rot)
        out = self.groups.setdefault(color, [])
        for p0, p1, p2, n_hint in tris:
            q = [v_add(v_scale(m_apply(m, p), scale), pos) for p in (p0, p1, p2)]
            nh = v_norm(m_apply(m, v_norm(n_hint)))
            ng = v_norm(v_cross(v_sub(q[1], q[0]), v_sub(q[2], q[0])))
            if v_dot(ng, nh) < 0:
                q[1], q[2] = q[2], q[1]
                ng = v_scale(ng, -1)
            out.append((q[0], q[1], q[2], ng))


def build_glb(model, name):
    """Pack triangle soup into a valid glTF 2.0 binary (one mesh, one
    primitive per color; positions + flat normals, non-indexed)."""
    bin_parts = []
    accessors, buffer_views, materials, primitives = [], [], [], []
    offset = 0

    for mi, (color, tris) in enumerate(model.groups.items()):
        positions, normals = [], []
        for p0, p1, p2, n in tris:
            positions += [p0, p1, p2]
            normals += [n, n, n]

        pos_bytes = b"".join(struct.pack("<fff", *p) for p in positions)
        nor_bytes = b"".join(struct.pack("<fff", *n) for n in normals)

        mins = [min(p[i] for p in positions) for i in range(3)]
        maxs = [max(p[i] for p in positions) for i in range(3)]

        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(pos_bytes), "target": 34962})
        bin_parts.append(pos_bytes)
        offset += len(pos_bytes)
        buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(nor_bytes), "target": 34962})
        bin_parts.append(nor_bytes)
        offset += len(nor_bytes)

        accessors.append({
            "bufferView": len(buffer_views) - 2, "componentType": 5126,
            "count": len(positions), "type": "VEC3", "min": mins, "max": maxs,
        })
        accessors.append({
            "bufferView": len(buffer_views) - 1, "componentType": 5126,
            "count": len(normals), "type": "VEC3",
        })
        materials.append({
            "name": f"mat_{color}",
            "pbrMetallicRoughness": {
                "baseColorFactor": hex_to_linear_rgba(color),
                "metallicFactor": 0.0,
                "roughnessFactor": 0.92,
            },
        })
        primitives.append({
            "attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1},
            "material": mi, "mode": 4,
        })

    bin_blob = b"".join(bin_parts)
    bin_blob += b"\x00" * ((4 - len(bin_blob) % 4) % 4)

    gltf = {
        "asset": {"version": "2.0", "generator": "Sutra placeholder generator"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": name}],
        "meshes": [{"name": name, "primitives": primitives}],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_blob)}],
    }
    json_blob = json.dumps(gltf, separators=(",", ":")).encode()
    json_blob += b" " * ((4 - len(json_blob) % 4) % 4)

    total = 12 + 8 + len(json_blob) + 8 + len(bin_blob)
    glb = struct.pack("<III", 0x46546C67, 2, total)
    glb += struct.pack("<II", len(json_blob), 0x4E4F534A) + json_blob
    glb += struct.pack("<II", len(bin_blob), 0x004E4942) + bin_blob
    return glb


# ---------------------------- the eight models ------------------------------
def inventory_model():
    """Inventory rack with stage-colored crates + one 'selected' crate."""
    m = Model()
    for x in (-0.78, 0.78):
        m.add(prim_box(0.09, 1.72, 0.09), INK, pos=(x, 0.05, 0))
    for y in (-0.58, 0.06, 0.7):
        m.add(prim_box(1.68, 0.07, 0.56), TEAL_L, pos=(0, y, 0))
    crates = [
        (0.34, -0.545, -0.38, 0.08, AMBER_L, 0.15),
        (0.30, -0.545, 0.05, 0.10, BLUE_L, -0.10),
        (0.30, -0.545, 0.42, -0.05, VIOLET_L, 0.05),
        (0.32, 0.095, -0.30, 0.05, ORANGE_L, -0.12),
        (0.28, 0.095, 0.28, 0.02, TEAL, 0.20),
        (0.26, 0.735, -0.15, 0.04, PINK_L, 0.10),
        (0.30, 0.735, 0.30, -0.02, BLUE_L, -0.18),
    ]
    for size, y, x, z, col, ry in crates:
        m.add(prim_box(size, size, size), col, pos=(x, y + size / 2, z), rot=(0, ry, 0))
    m.add(prim_box(0.34, 0.34, 0.34), TEAL, pos=(1.05, -0.05, 0.42), rot=(0.1, 0.5, 0.06))
    m.add(prim_cylinder(0.15, 0.15, 0.05, 10), WHITE, pos=(1.05, 0.36, 0.42), rot=(math.pi / 2, 0, 0))
    m.add(prim_box(0.07, 0.035, 0.02), GREEN_D, pos=(1.014, 0.345, 0.455), rot=(0, 0, math.pi / 4))
    m.add(prim_box(0.13, 0.035, 0.02), GREEN_D, pos=(1.08, 0.365, 0.455), rot=(0, 0, -math.pi / 4))
    return m


def quote_model():
    """Quotation: paper + priced line items + total + APPROVED badge."""
    m = Model()
    m.add(prim_box(1.14, 1.46, 0.07), PAPER)
    m.add(prim_box(0.34, 0.34, 0.075), AMBER_L, pos=(0.445, 0.595, 0.004), rot=(0, 0, math.pi / 4))
    m.add(prim_box(0.8, 0.07, 0.03), AMBER, pos=(-0.02, 0.52, 0.05))
    for i in range(4):
        m.add(prim_box(0.5, 0.05, 0.03), LILAC, pos=(-0.2, 0.32 - i * 0.16, 0.05))
        m.add(prim_box(0.18, 0.05, 0.03), AMBER_L, pos=(0.28, 0.32 - i * 0.16, 0.05))
    m.add(prim_box(0.86, 0.12, 0.04), AMBER, pos=(0, -0.34, 0.055))
    m.add(prim_torus(0.21, 0.04, 6, 14), GREEN, pos=(0.3, -0.72, 0.06))
    m.add(prim_cylinder(0.13, 0.13, 0.05, 10), GREEN_L, pos=(0.3, -0.72, 0.05), rot=(math.pi / 2, 0, 0))
    m.add(prim_box(0.09, 0.04, 0.03), GREEN_D, pos=(0.26, -0.73, 0.09), rot=(0, 0, math.pi / 4))
    m.add(prim_box(0.16, 0.04, 0.03), GREEN_D, pos=(0.34, -0.71, 0.09), rot=(0, 0, -math.pi / 4))
    m.add(prim_box(0.3, 0.035, 0.03), INK, pos=(-0.32, -0.7, 0.05), rot=(0, 0, 0.18))
    m.add(prim_box(0.18, 0.035, 0.03), INK, pos=(-0.26, -0.78, 0.05), rot=(0, 0, -0.12))
    return m


def order_model():
    m = Model()
    m.add(prim_box(1.14, 1.46, 0.07), PAPER)
    m.add(prim_box(0.34, 0.34, 0.075), VIOLET_L, pos=(0.445, 0.595, 0.004), rot=(0, 0, math.pi / 4))
    for w, y, col in [(0.62, 0.42, VIOLET_L), (0.74, 0.24, LILAC), (0.58, 0.06, LILAC), (0.66, -0.12, LILAC), (0.4, -0.3, LILAC)]:
        m.add(prim_box(w, 0.055, 0.03), col, pos=(-0.5 + w / 2 + 0.14, y, 0.05))
    m.add(prim_cylinder(0.19, 0.19, 0.06, 10), VIOLET, pos=(0.32, -0.48, 0.09), rot=(math.pi / 2, 0, 0))
    m.add(prim_box(0.17, 0.045, 0.02), WHITE, pos=(0.32, -0.48, 0.13))
    m.add(prim_box(0.045, 0.17, 0.02), WHITE, pos=(0.32, -0.48, 0.13))
    return m


def payment_model():
    m = Model()
    m.add(prim_cylinder(0.46, 0.46, 0.11, 12), MINT, pos=(0.1, -0.52, 0))
    m.add(prim_cylinder(0.4, 0.4, 0.11, 12), PAPER, pos=(-0.12, -0.4, 0.06))
    tilt = (math.pi / 2 - 0.42, 0, -0.25)
    m.add(prim_cylinder(0.62, 0.62, 0.12, 12), GREEN, pos=(0, 0.18, 0), rot=tilt)
    m.add(prim_cylinder(0.47, 0.47, 0.14, 12), GREEN_L, pos=(0, 0.18, 0), rot=tilt)
    m.add(prim_box(0.34, 0.09, 0.16), GREEN_D, pos=(0, 0.19, 0.02), rot=(-0.42, 0, 0.35))
    m.add(prim_cylinder(0.24, 0.24, 0.09, 10), GREEN_D, pos=(0.62, 0.72, 0.12), rot=(math.pi / 2, 0, 0))
    m.add(prim_box(0.1, 0.045, 0.03), WHITE, pos=(0.567, 0.68, 0.17), rot=(0, 0, math.pi / 4))
    m.add(prim_box(0.2, 0.045, 0.03), WHITE, pos=(0.665, 0.72, 0.17), rot=(0, 0, -math.pi / 4))
    return m


def invoice_model():
    """Invoice with payment-status chips + inventory-sync crate & ring."""
    m = Model()
    m.add(prim_box(1.1, 1.42, 0.07), PAPER, pos=(-0.18, 0.1, 0))
    m.add(prim_box(0.3, 0.3, 0.075), BLUE_L, pos=(0.23, 0.66, 0.004), rot=(0, 0, math.pi / 4))
    m.add(prim_box(0.82, 0.07, 0.03), BLUE_L, pos=(-0.18, 0.6, 0.05))
    for i in range(3):
        m.add(prim_box(0.5, 0.05, 0.03), LILAC, pos=(-0.31, 0.4 - i * 0.16, 0.05))
        m.add(prim_box(0.16, 0.05, 0.03), BLUE_L, pos=(0.13, 0.4 - i * 0.16, 0.05))
    for k, col in enumerate((GREEN, AMBER, ROSE)):
        m.add(prim_box(0.24, 0.11, 0.05), col, pos=(-0.44 + k * 0.28, -0.12, 0.055))
    m.add(prim_box(0.82, 0.12, 0.04), BLUE, pos=(-0.18, -0.38, 0.055))
    m.add(prim_box(0.4, 0.4, 0.4), BLUE_L, pos=(0.72, -0.52, 0.2), rot=(0, 0.5, 0))
    m.add(prim_torus(0.4, 0.032, 6, 16), BLUE, pos=(0.72, -0.52, 0.2), rot=(1.15, 0.25, 0))
    return m


def delivery_model():
    m = Model()
    s = 0.92
    m.add(prim_box(1.42, 0.82, 0.78), PAPER, pos=(-0.28 * s, 0.18 * s, 0), scale=s)
    m.add(prim_box(0.5, 0.07, 0.8), ORANGE, pos=(-0.28 * s, -0.02 * s, 0), scale=s)
    m.add(prim_box(0.56, 0.58, 0.72), ORANGE, pos=(0.78 * s, 0.05 * s, 0), scale=s)
    m.add(prim_box(0.05, 0.3, 0.6), INK, pos=(1.065 * s, 0.16 * s, 0), scale=s)
    m.add(prim_box(2.06, 0.14, 0.62), INK, pos=(0, -0.3 * s, 0), scale=s)
    for x in (-0.72, -0.06, 0.78):
        for z in (0.36, -0.36):
            m.add(prim_cylinder(0.21, 0.21, 0.13, 9), INK, pos=(x * s, -0.44 * s, z * s), rot=(math.pi / 2, 0, 0), scale=s)
            m.add(prim_cylinder(0.09, 0.09, 0.15, 9), ORANGE_L, pos=(x * s, -0.44 * s, z * s), rot=(math.pi / 2, 0, 0), scale=s)
    return m


def resource_model():
    m = Model()
    m.add(prim_cylinder(0.85, 0.95, 0.09, 11), PINK_XL, pos=(0, -0.72, 0))
    m.add(prim_cylinder(0.17, 0.3, 0.72, 7), PINK, pos=(-0.32, -0.28, 0.05))
    m.add(prim_icosahedron(0.17), PAPER, pos=(-0.32, 0.22, 0.05))
    m.add(prim_cylinder(0.15, 0.27, 0.58, 7), PAPER, pos=(0.3, -0.35, -0.1))
    m.add(prim_icosahedron(0.15), PINK_L, pos=(0.3, 0.06, -0.1))
    m.add(prim_cylinder(0.4, 0.4, 0.09, 12), WHITE, pos=(0.55, 0.78, 0.12), rot=(math.pi / 2, 0, 0))
    m.add(prim_torus(0.4, 0.05, 6, 14), PINK, pos=(0.55, 0.78, 0.12))
    m.add(prim_box(0.05, 0.22, 0.03), INK, pos=(0.55, 0.87, 0.18))
    m.add(prim_box(0.16, 0.05, 0.03), INK, pos=(0.62, 0.78, 0.18))
    return m


def console_model():
    """Backend control room: tilted board with sliders, knobs & screen."""
    m = Model()
    tilt = -0.55
    R = rot_matrix(tilt, 0, 0)
    board_center = (0, 0.18, 0)

    def on_board(lx, ly, lift=0.07):
        return v_add(board_center, m_apply(R, (lx, ly, lift)))

    m.add(prim_box(1.52, 0.95, 0.09), INDIGO_D, pos=board_center, rot=(tilt, 0, 0))
    m.add(prim_box(1.24, 0.12, 0.52), INDIGO, pos=(0, -0.46, -0.05))
    m.add(prim_box(0.16, 0.28, 0.16), INK, pos=(-0.45, -0.68, -0.05))
    m.add(prim_box(0.16, 0.28, 0.16), INK, pos=(0.45, -0.68, -0.05))
    for lx, knob_ly, col in [(-0.55, 0.17, TEAL), (-0.33, -0.08, AMBER), (-0.11, 0.06, GREEN)]:
        m.add(prim_box(0.05, 0.58, 0.03), GRAY, pos=on_board(lx, 0.02, 0.055), rot=(tilt, 0, 0))
        m.add(prim_box(0.13, 0.11, 0.09), col, pos=on_board(lx, knob_ly, 0.075), rot=(tilt, 0, 0))
    m.add(prim_cylinder(0.11, 0.11, 0.07, 9), VIOLET, pos=on_board(0.24, -0.22, 0.075), rot=(math.pi / 2 + tilt, 0, 0))
    m.add(prim_cylinder(0.09, 0.09, 0.07, 9), PINK, pos=on_board(0.52, -0.22, 0.075), rot=(math.pi / 2 + tilt, 0, 0))
    m.add(prim_box(0.62, 0.34, 0.04), INDIGO_L, pos=on_board(0.38, 0.16, 0.06), rot=(tilt, 0, 0))
    m.add(prim_box(0.4, 0.05, 0.03), WHITE, pos=on_board(0.34, 0.2, 0.085), rot=(tilt, 0, 0))
    m.add(prim_box(0.26, 0.05, 0.03), WHITE, pos=on_board(0.3, 0.1, 0.085), rot=(tilt, 0, 0))
    return m


# ------------------------------- validation ---------------------------------
def validate_glb(path):
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", data, 0)
    assert magic == 0x46546C67 and version == 2, "bad GLB header"
    assert length == len(data), "length mismatch"
    jlen, jtype = struct.unpack_from("<II", data, 12)
    assert jtype == 0x4E4F534A, "first chunk must be JSON"
    gltf = json.loads(data[20 : 20 + jlen])
    blen, btype = struct.unpack_from("<II", data, 20 + jlen)
    assert btype == 0x004E4942, "second chunk must be BIN"
    assert gltf["buffers"][0]["byteLength"] == blen, "buffer length mismatch"
    tri_count = 0
    for prim in gltf["meshes"][0]["primitives"]:
        pos_acc = gltf["accessors"][prim["attributes"]["POSITION"]]
        nor_acc = gltf["accessors"][prim["attributes"]["NORMAL"]]
        assert pos_acc["count"] == nor_acc["count"] and pos_acc["count"] % 3 == 0
        view = gltf["bufferViews"][pos_acc["bufferView"]]
        assert view["byteOffset"] + view["byteLength"] <= blen
        tri_count += pos_acc["count"] // 3
    return tri_count, len(data)


# --------------------------- model preview page ------------------------------
def write_preview(files):
    """Standalone QA page: all eight GLBs embedded as base64, three.js from
    CDN, orbit controls. Open directly in a browser - no server needed."""
    embeds = {name: base64.b64encode((OUT / f"{name}.glb").read_bytes()).decode() for name in files}
    html = f"""<!doctype html>
<!-- model-preview.html - generated by scripts/generate_models.py.
     QA page for the placeholder GLBs (drag to orbit). Not part of the site. -->
<html lang="en"><head><meta charset="utf-8"><title>Sutra - model preview</title>
<style>
  body {{ margin:0; background:#fff; font:13px/1.4 system-ui, sans-serif; color:#6B6B76; }}
  #bar {{ position:fixed; top:12px; left:16px; }} b {{ color:#1D1B26; }}
</style>
<script type="importmap">{{"imports":{{"three":"https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"}}}}</script>
</head><body>
<div id="bar"><b>Placeholder model preview</b> - inventory · quote · order · payment · invoice · delivery · resource · console. Drag to orbit.</div>
<script type="module">
import * as THREE from 'three'
import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js'
import {{ GLTFLoader }} from 'three/addons/loaders/GLTFLoader.js'

const models = {json.dumps(embeds)}
const scene = new THREE.Scene()
scene.background = new THREE.Color('#FFFFFF')
const camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 100)
camera.position.set(0, 2.8, 12.5)
const renderer = new THREE.WebGLRenderer({{ antialias:true }})
renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.NoToneMapping
document.body.appendChild(renderer.domElement)
scene.add(new THREE.HemisphereLight('#FFFFFF', '#ECEAF6', 0.95))
const key = new THREE.DirectionalLight('#FFFFFF', 1.55); key.position.set(7,10,5); scene.add(key)
const fill = new THREE.DirectionalLight('#F4F2FB', 0.45); fill.position.set(-6,4,-3); scene.add(fill)
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0,0,0)
const loader = new GLTFLoader()
const names = Object.keys(models)
names.forEach((name, i) => {{
  fetch('data:application/octet-stream;base64,' + models[name]).then(r => r.arrayBuffer()).then(buf => {{
    loader.parse(buf, '', (gltf) => {{
      gltf.scene.position.set((i - (names.length-1)/2) * 2.4, 0, 0)
      scene.add(gltf.scene)
    }})
  }})
}})
renderer.setAnimationLoop(() => {{ controls.update(); renderer.render(scene, camera) }})
addEventListener('resize', () => {{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
}})
</script></body></html>"""
    (ROOT / "model-preview.html").write_text(html)


# --------------------------------- main --------------------------------------
if __name__ == "__main__":
    builders = {
        "inventory": inventory_model,
        "quote": quote_model,
        "order": order_model,
        "payment": payment_model,
        "invoice": invoice_model,
        "delivery": delivery_model,
        "resource": resource_model,
        "console": console_model,
    }
    for name, fn in builders.items():
        glb = build_glb(fn(), name)
        (OUT / f"{name}.glb").write_bytes(glb)
        tris, size = validate_glb(OUT / f"{name}.glb")
        print(f"  OK {name}.glb  {tris} tris  {size/1024:.1f} KB  (validated)")
    write_preview(list(builders))
    print("All models written to public/models/ · preview at model-preview.html")
