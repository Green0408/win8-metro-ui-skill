# 官方 API 覆盖对照

官方清单由 `check_api_coverage.py` 直接解析 `raw/js_WinJS_Animations.js`（微软 MIT 许可）得出，非手抄。

| 项目 | 数量 |
|---|---|
| 官方 `WinJS.UI.Animation` 成员 | 51 |
| 本库已实现 | 51 |
| 其中官方内部成员（`_` 前缀） | 1 |
| **缺失** | **0** |
| 本库扩展（官方没有） | 9 |

## 官方成员逐条对照

| # | 官方成员 | 本库 | 说明 |
|---|---|---|---|
| 1 | `createExpandAnimation` | ✅ |  |
| 2 | `createCollapseAnimation` | ✅ |  |
| 3 | `createRepositionAnimation` | ✅ |  |
| 4 | `fadeIn` | ✅ |  |
| 5 | `fadeOut` | ✅ |  |
| 6 | `createAddToListAnimation` | ✅ |  |
| 7 | `createDeleteFromListAnimation` | ✅ |  |
| 8 | `_createUpdateListAnimation` | ✅ | 官方内部 API：新增 + 删除 + 其余项归位三合一 |
| 9 | `createAddToSearchListAnimation` | ✅ | 搜索列表专用：117ms 新增 / 93ms 删除 |
| 10 | `createDeleteFromSearchListAnimation` | ✅ |  |
| 11 | `showEdgeUI` | ✅ |  |
| 12 | `showPanel` | ✅ | 官方签名就两个参数，本库保持一致 |
| 13 | `hideEdgeUI` | ✅ |  |
| 14 | `hidePanel` | ✅ |  |
| 15 | `showPopup` | ✅ |  |
| 16 | `hidePopup` | ✅ |  |
| 17 | `pointerDown` | ✅ |  |
| 18 | `pointerUp` | ✅ |  |
| 19 | `dragSourceStart` | ✅ |  |
| 20 | `dragSourceEnd` | ✅ |  |
| 21 | `enterContent` | ✅ |  |
| 22 | `exitContent` | ✅ |  |
| 23 | `dragBetweenEnter` | ✅ |  |
| 24 | `dragBetweenLeave` | ✅ |  |
| 25 | `swipeSelect` | ✅ |  |
| 26 | `swipeDeselect` | ✅ |  |
| 27 | `swipeReveal` | ✅ |  |
| 28 | `enterPage` | ✅ |  |
| 29 | `exitPage` | ✅ |  |
| 30 | `crossFade` | ✅ |  |
| 31 | `createPeekAnimation` | ✅ | 受影响元素 2000ms 缓慢归位 |
| 32 | `updateBadge` | ✅ |  |
| 33 | `turnstileForwardIn` | ✅ |  |
| 34 | `turnstileForwardOut` | ✅ |  |
| 35 | `turnstileBackwardIn` | ✅ |  |
| 36 | `turnstileBackwardOut` | ✅ |  |
| 37 | `slideDown` | ✅ |  |
| 38 | `slideUp` | ✅ |  |
| 39 | `slideRightIn` | ✅ |  |
| 40 | `slideRightOut` | ✅ |  |
| 41 | `slideLeftIn` | ✅ |  |
| 42 | `slideLeftOut` | ✅ |  |
| 43 | `continuumForwardIn` | ✅ |  |
| 44 | `continuumForwardOut` | ✅ |  |
| 45 | `continuumBackwardIn` | ✅ |  |
| 46 | `continuumBackwardOut` | ✅ |  |
| 47 | `drillInIncoming` | ✅ |  |
| 48 | `drillInOutgoing` | ✅ |  |
| 49 | `drillOutIncoming` | ✅ |  |
| 50 | `drillOutOutgoing` | ✅ |  |
| 51 | `createPageNavigationAnimations` | ✅ | 官方 4.x 实现已退化为桩；本库按官方枚举文档实现四种转场 |

## 本库扩展（官方命名空间里没有，均为附加能力，不影响官方行为）

| 扩展 | 说明（与官方的对应关系） |
|---|---|
| `_fastAnimations` | 官方命名：`WinJS.Utilities._fastAnimations`（×1/20） |
| `_slowAnimations` | 官方命名：`WinJS.Utilities._slowAnimations`（×3） |
| `enabled` | 官方对应 `WinJS.UI.isAnimationEnabled`（同一开关的短别名） |
| `factor` | 官方 `_animationFactor` 的只读视图 |
| `fast` | 官方对应 `WinJS.Utilities._fastAnimations`（×1/20） |
| `isAnimationEnabled` | 官方命名：`WinJS.UI.isAnimationEnabled` |
| `resizeTransition` | 官方 `WinJS.Utilities._resizeTransition`（在 Utilities 命名空间，不在 Animation 里）；左侧导航开合用的宽度变化错觉动画 |
| `settingsFlyoutSlideIn` | 复刻 `SettingsFlyout._animateSlideIn`：showPanel 框架 + 内容区域分批 enterPage |
| `slow` | 官方对应 `WinJS.Utilities._slowAnimations`（×3） |

## 官方明确不属于本库的部分

| 官方位置 | 说明 |
|---|---|
| `WinJS.Utilities._resizeTransition` | 官方把 resize 动画放在 **Utilities** 命名空间（内部 API），不在 `WinJS.UI.Animation` 里 |
| `WinJS.UI.PageNavigationAnimation` | 枚举（turnstile / slide / enterPage / continuum），不是动画函数 |
| `SettingsFlyout._animateSlideIn` | 控件方法，本库用 `settingsFlyoutSlideIn` 复刻其行为 |

