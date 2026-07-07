#!/usr/bin/env python3
"""
audit_src.py - offline sanity audit for the source tree (no npm needed).
Checks every .js/.jsx file for:
  1. balanced (), [], {} after stripping strings/template-literals/comments
  2. relative imports that resolve to real files
  3. named imports from project modules that the target actually exports
Exit code 1 on any finding. This complements (not replaces) `vite build`.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
findings = []


def strip_code(text):
    """Remove comments and string/template-literal contents while keeping
    line count and the code inside ${...} expressions (state machine)."""
    out, i, n = [], 0, len(text)
    ctx = [["code", 0]]  # stack of [mode, braceDepth]
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        mode, depth = ctx[-1]
        if mode == "code":
            if c == "/" and nxt == "/":
                j = text.find("\n", i)
                i = n if j == -1 else j
            elif c == "/" and nxt == "*":
                j = text.find("*/", i + 2)
                seg = text[i : (n if j == -1 else j + 2)]
                out.append("\n" * seg.count("\n"))
                i = n if j == -1 else j + 2
            elif c in "'\"":
                j = i + 1
                while j < n and text[j] != c:
                    j += 2 if text[j] == "\\" else 1
                out.append("\n" * text[i : j + 1].count("\n"))
                i = j + 1
            elif c == "`":
                ctx.append(["tpl", 0])
                i += 1
            elif c == "{":
                ctx[-1][1] += 1
                out.append(c)
                i += 1
            elif c == "}":
                if depth == 0 and len(ctx) > 1 and ctx[-2][0] == "tpl":
                    ctx.pop()  # end of ${ expr } -> resume template scanning
                else:
                    ctx[-1][1] = max(0, depth - 1)
                    out.append(c)
                i += 1
            else:
                out.append(c)
                i += 1
        else:  # inside a template literal
            if c == "\\":
                i += 2
            elif c == "`":
                ctx.pop()
                i += 1
            elif c == "$" and nxt == "{":
                ctx.append(["code", 0])
                i += 2
            else:
                if c == "\n":
                    out.append("\n")
                i += 1
    return "".join(out)


def check_balance(path, text):
    stripped = strip_code(text)
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for idx, ch in enumerate(stripped):
        if ch in "([{":
            stack.append((ch, stripped[:idx].count("\n") + 1))
        elif ch in ")]}":
            if not stack or stack[-1][0] != pairs[ch]:
                findings.append(f"{path}: unbalanced '{ch}' near line {stripped[:idx].count(chr(10)) + 1}")
                return
            stack.pop()
    if stack:
        findings.append(f"{path}: unclosed '{stack[-1][0]}' from line {stack[-1][1]}")


IMPORT_RE = re.compile(r"import\s+(?:([\w{}\s,*]+)\s+from\s+)?['\"]([^'\"]+)['\"]")
EXPORT_RE = re.compile(r"export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)|export\s*\{([^}]+)\}")


def exports_of(path):
    text = path.read_text(encoding="utf-8")
    names = set()
    if re.search(r"export\s+default", text):
        names.add("default")
    for m in EXPORT_RE.finditer(text):
        if m.group(1):
            names.add(m.group(1))
        if m.group(2):
            for part in m.group(2).split(","):
                part = part.strip()
                if part:
                    names.add(part.split(" as ")[-1].strip())
    return names


def check_imports(path, text):
    for m in IMPORT_RE.finditer(text):
        clause, spec = m.group(1), m.group(2)
        if not spec.startswith("."):
            continue  # package imports can't be resolved offline
        target = (path.parent / spec).resolve()
        if not target.exists():
            findings.append(f"{path}: unresolved import '{spec}'")
            continue
        if clause is None or target.suffix not in (".js", ".jsx"):
            continue
        exp = exports_of(target)
        clause = clause.strip()
        default_part, named_part = None, ""
        if clause.startswith("{"):
            named_part = clause.strip("{}")
        elif "{" in clause:
            default_part, named_part = clause.split("{", 1)
            named_part = named_part.rstrip("}")
            default_part = default_part.rstrip(", \t")
        elif not clause.startswith("*"):
            default_part = clause
        if default_part and default_part.strip() and "default" not in exp:
            findings.append(f"{path}: default import from '{spec}' but no default export")
        for name in filter(None, (x.strip().split(" as ")[0].strip() for x in named_part.split(","))):
            if name and name not in exp:
                findings.append(f"{path}: '{name}' not exported by '{spec}'")


files = sorted(SRC.rglob("*.js*"))
for f in files:
    text = f.read_text(encoding="utf-8")
    check_balance(f.relative_to(ROOT), text)
    check_imports(f, text)

print(f"audited {len(files)} files")
if findings:
    print("\n".join(f"  x {x}" for x in findings))
    sys.exit(1)
print("  OK: brackets balanced, relative imports resolve, named imports match exports")
