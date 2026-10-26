#!/usr/bin/env python3
"""Extract the official Windows 8 / WinJS named-animation parameters from Microsoft's
MIT-licensed WinJS source (src/js/WinJS/Animations.js).

Outputs:
  official-values.json  - machine readable
  official-values.md    - human readable reference tables
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "raw" / "js_WinJS_Animations.js"
text = SRC.read_text(encoding="utf-8")

CLASS_RE = re.compile(r"var (_?\w+Animation)\s*=\s*_Base\.Class\.define\(")
entry_re = re.compile(r"^        (\w+): function \(", re.M)


def enclosing_class(pos: int) -> str:
    best = ""
    for m in CLASS_RE.finditer(text):
        if m.start() < pos:
            best = m.group(1)
        else:
            break
    return best


def block_end(start: int) -> int:
    i = text.index("{", start)
    depth = 0
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i + 1
        elif c in "\"'`":
            q, i = c, i + 1
            while i < len(text) and text[i] != q:
                i += 2 if text[i] == "\\" else 1
        i += 1
    return len(text)


def doc(body: str, tag: str) -> str:
    m = re.search(r'/// <' + tag + r'[^>]*>\s*\n?\s*/// (.*?)(?:\n\s*/// </' + tag + r'>|\n)', body)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else ""


def transitions(body: str):
    out = []
    for m in re.finditer(r"\{[^{}]*?duration:\s*([^,\n}]+)[^{}]*?\}", body, re.S):
        blob = m.group(0)
        if "timing" not in blob:
            continue

        def field(name):
            f = re.search(name + r":\s*(.+?)(?:,\s*\n|\s*\})", blob, re.S)
            return re.sub(r"\s+", " ", f.group(1)).strip().rstrip(",") if f else ""

        out.append(
            {
                "keyframe": field("keyframe") or "-",
                "property": field("property"),
                "duration": re.sub(r"\s+", " ", m.group(1)).strip().rstrip(","),
                "delay": field("delay").rstrip(",") or "0",
                "timing": field("timing"),
                "from": field("from") or "-",
                "to": field("to") or "-",
            }
        )
    return out


entries = list(entry_re.finditer(text))
rows, seen = [], set()
for idx, m in enumerate(entries):
    end = entries[idx + 1].start() if idx + 1 < len(entries) else len(text)
    body = text[m.start():end]
    name = m.group(1)
    cls = enclosing_class(m.start())
    if name in ("execute", "getOffset") and cls:
        name, kind = cls, "class"
    else:
        kind = "api"
    if name in seen:
        continue
    seen.add(name)
    tr = transitions(body)
    delegates = re.findall(r"return (anim\w+|exports\.\w+)\(([^;]*?)\)\s*\.then", body, re.S)
    rows.append(
        {
            "name": name,
            "kind": kind,
            "summary": doc(body, "summary"),
            "params": doc(body, "param") and "",
            "signature": re.search(r"function \(([^)]*)\)", body).group(1).strip(),
            "delegates_to": [
                {"fn": f, "args": re.sub(r"\s+", " ", a).strip()} for f, a in delegates
            ],
            "transitions": tr,
        }
    )

(HERE / "official-values.json").write_text(
    json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8"
)

L = []
L.append("# Windows 8 / WinJS 官方动画参数表\n")
L.append(
    "从微软 MIT 许可的 WinJS 源码 `src/js/WinJS/Animations.js`（命名空间 `WinJS.UI.Animation`）逐条提取，"
    "未经改动。时间是毫秒；运行时会把数值乘以 `_animationFactor`（对应系统「关闭不必要的动画」设置）。\n"
)
L.append("| # | 动画 | 说明 | 属性 | 关键帧 | 时长 | 延迟 | 缓动曲线 | from → to |")
L.append("|---|------|------|------|--------|------|------|----------|-----------|")
i = 0
for r in rows:
    if r["transitions"]:
        for t in r["transitions"]:
            i += 1
            L.append(
                f"| {i} | `{r['name']}` | {r['summary'][:44]} | `{t['property']}` | `{t['keyframe']}` | "
                f"{t['duration']} ms | {t['delay']} | `{t['timing']}` | `{t['from']}` → `{t['to']}` |"
            )
    else:
        d = ", ".join(f"{x['fn']}({x['args'][:70]})" for x in r["delegates_to"]) or "组合动画工厂"
        L.append(f"| – | `{r['name']}` | {r['summary'][:44]} | – | – | – | – | {d} | – |")

(HERE / "official-values.md").write_text("\n".join(L) + "\n", encoding="utf-8")
print(f"{len(rows)} animations, {i} transition rows")
