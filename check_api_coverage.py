#!/usr/bin/env python3
"""对比官方 WinJS.UI.Animation 的 API 面与本库实现，生成 official-api-coverage.md。

官方清单直接解析 raw/js_WinJS_Animations.js（MIT），不是手抄。
用法：python3 check_api_coverage.py
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
OFFICIAL_SRC = HERE / "raw" / "js_WinJS_Animations.js"
MINE_SRC = HERE / "win8-animations.js"
OUT = HERE / "official-api-coverage.md"

official_src = OFFICIAL_SRC.read_text(encoding="utf-8")
mine_src = MINE_SRC.read_text(encoding="utf-8")

# 官方：命名空间对象里的成员（排除 OffsetArray / *Animation 类的内部方法）
official = [
    n for n in re.findall(r"^        (\w+): function \(", official_src, re.M)
    if n not in ("execute", "getOffset")
]

# 本库：对象字面量里的方法与 get/set 访问器
mine = set(re.findall(r"^        (\w+): function \(", mine_src, re.M))
mine |= set(re.findall(r"^        (?:get|set) (\w+)\(", mine_src, re.M))

implemented = [n for n in official if n in mine]
missing = [n for n in official if n not in mine]

# 本库自有、官方命名空间里没有的成员（扩展）
extensions = sorted(m for m in mine if m not in official)

# 官方内部成员（下划线前缀）
internal = [n for n in official if n.startswith("_")]

lines = []
lines.append("# 官方 API 覆盖对照\n")
lines.append(
    "官方清单由 `check_api_coverage.py` 直接解析 `raw/js_WinJS_Animations.js`（微软 MIT 许可）得出，非手抄。\n"
)
lines.append("| 项目 | 数量 |")
lines.append("|---|---|")
lines.append(f"| 官方 `WinJS.UI.Animation` 成员 | {len(official)} |")
lines.append(f"| 本库已实现 | {len(implemented)} |")
lines.append(f"| 其中官方内部成员（`_` 前缀） | {len(internal)} |")
lines.append(f"| **缺失** | **{len(missing)}** |")
lines.append(f"| 本库扩展（官方没有） | {len(extensions)} |")
lines.append("")

lines.append("## 官方成员逐条对照\n")
lines.append("| # | 官方成员 | 本库 | 说明 |")
lines.append("|---|---|---|---|")
NOTES = {
    "_createUpdateListAnimation": "官方内部 API：新增 + 删除 + 其余项归位三合一",
    "createPageNavigationAnimations": "官方 4.x 实现已退化为桩；本库按官方枚举文档实现四种转场",
    "showPanel": "官方签名就两个参数，本库保持一致",
    "createAddToSearchListAnimation": "搜索列表专用：117ms 新增 / 93ms 删除",
    "createPeekAnimation": "受影响元素 2000ms 缓慢归位",
}
for i, name in enumerate(official, 1):
    ok = "✅" if name in mine else "❌ **缺失**"
    lines.append(f"| {i} | `{name}` | {ok} | {NOTES.get(name, '')} |")

lines.append("")
lines.append("## 本库扩展（官方命名空间里没有，均为附加能力，不影响官方行为）\n")
lines.append("| 扩展 | 说明（与官方的对应关系） |")
lines.append("|---|---|")
EXT_NOTES = {
    "settingsFlyoutSlideIn": "复刻 `SettingsFlyout._animateSlideIn`：showPanel 框架 + 内容区域分批 enterPage",
    "resizeTransition": "官方 `WinJS.Utilities._resizeTransition`（在 Utilities 命名空间，不在 Animation 里）；左侧导航开合用的宽度变化错觉动画",
    "EASE": "官方把曲线写成内联字符串，这里只是给它们起了名字，值一字未改",
    "stagger": "官方内部函数 `staggerDelay` 的等价导出，便于自算交错延迟",
    "enabled": "官方对应 `WinJS.UI.isAnimationEnabled`（同一开关的短别名）",
    "isAnimationEnabled": "官方命名：`WinJS.UI.isAnimationEnabled`",
    "fast": "官方对应 `WinJS.Utilities._fastAnimations`（×1/20）",
    "_fastAnimations": "官方命名：`WinJS.Utilities._fastAnimations`（×1/20）",
    "slow": "官方对应 `WinJS.Utilities._slowAnimations`（×3）",
    "_slowAnimations": "官方命名：`WinJS.Utilities._slowAnimations`（×3）",
    "factor": "官方 `_animationFactor` 的只读视图",
}
for name in extensions:
    lines.append(f"| `{name}` | {EXT_NOTES.get(name, '—')} |")

lines.append("")
lines.append("## 官方明确不属于本库的部分\n")
lines.append(
    "| 官方位置 | 说明 |\n|---|---|\n"
    "| `WinJS.Utilities._resizeTransition` | 官方把 resize 动画放在 **Utilities** 命名空间（内部 API），不在 `WinJS.UI.Animation` 里 |\n"
    "| `WinJS.UI.PageNavigationAnimation` | 枚举（turnstile / slide / enterPage / continuum），不是动画函数 |\n"
    "| `SettingsFlyout._animateSlideIn` | 控件方法，本库用 `settingsFlyoutSlideIn` 复刻其行为 |\n"
)
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"官方成员 {len(official)}，已实现 {len(implemented)}，缺失 {len(missing)}，扩展 {len(extensions)}")
if missing:
    print("缺失:", missing)
