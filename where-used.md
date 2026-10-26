# 每条官方动画用在哪里

三类来源，分开标注，避免把"我的推断"当成"官方事实"：

- **【源码】** —— 在微软 WinJS 控件源码里搜到了真实调用（附 `文件:行号`），这是硬证据。
- **【官方文档】** —— 来自微软 MSDN / Learn 的枚举与 API 说明（如 `WinJS.UI.PageNavigationAnimation`）。
- **【设计场景】** —— 依据微软动画设计指南的"动画词汇表"（usage patterns）对应到 Win8 的界面元素，属于合理映射，不是源码证据。

**一个重要事实**：WinJS 控件本身只调用了库里的一小部分动画（AppBar 用 `showEdgeUI`、设置面板用 `showPanel`、浮出控件用 `showPopup`、Tooltip 用 `fadeIn/fadeOut`…）。
其余的（磁贴按下、拖拽、滑动多选、页面转场、转门/连续体/钻取）**都是给应用作者用的** —— 它们对应的正是"你自己画的磁贴、自己的页面"。

---

## A. WinJS 控件内部真正在用的（有源码证据）

| 动画 | 用在哪 | 具体场景 | 证据（`src/js/WinJS/Controls/`） |
|---|---|---|---|
| `showEdgeUI` / `hideEdgeUI` | **AppBar** | 应用栏从屏幕边缘滑入/滑出。**偏移量符号由位置决定**：`offsetTop = (placement === "top") ? -distance : +distance`，即底部 AppBar 传正数、顶部传负数 | `_LegacyAppBar.js:839, 854, 857` |
| `showPanel` / `hidePanel` | **SettingsFlyout（设置面板）** | 设置面板从右侧滑入，偏移量取**面板自身宽度**：`{top:"0px", left:"±"+width}`（这正是 `showPanel` 默认值 364px 的来源）。注意它只管**框架** | `SettingsFlyout.js:375, 393` |
| `enterPage`（分批） | **SettingsFlyout 面板内的内容区域** | 控件对每个 `div.win-content` 各调一次 `enterPage`（±100px），与本库的 `settingsFlyoutSlideIn` 对应 | `SettingsFlyout.js:353-355` |
| `enterPage` | **SettingsFlyout** | 面板**内部**的命令元素按 `±100px` 依次进场（不是整页转场） | `SettingsFlyout.js:355` |
| `showPopup` / `hidePopup` | **Flyout（浮出控件）**、**AutoSuggestBox（自动完成）** | 浮出层定位到锚点后弹出；自动完成候选列表弹出 | `Flyout.js:1393, 1402`；`AutoSuggestBox.js:497` |
| `fadeIn` / `fadeOut` | **ContentDialog** | 对话框根节点显示/关闭（配套遮罩层淡入淡出） | `ContentDialog.js:920, 924` |
| | **Tooltip** | 工具提示出现/消失 | `Tooltip.js:812, 890` |
| | **Flyout 的遮罩层** | `_Overlay` 显示/隐藏 | `Flyout/_Overlay.js:532, 539` |
| | **NavBar** | 左右两侧滚动箭头随可滚状态淡入/淡出 | `NavBar/_Container.js:1258, 1273, 1286, 1297` |
| | **SemanticZoom** | 缩放按钮出现/消失 | `SemanticZoom.js:687, 701` |
| | **ListView** | 加载进度环淡入淡出；视图切换时整个视口淡出 | `ListView.js:3213, 3232, 3774` |
| | **FlipView** | 上一页/下一页按钮淡出；翻页时旧页淡出 | `FlipView.js:1209, 1220, 1262` |
| | **Hub** | 视口切换时淡出 | `Hub.js:439` |
| | **AutoSuggestBox** | 搜索图标淡入 | `AutoSuggestBox.js:1288` |
| `createAddToListAnimation` / `createDeleteFromListAnimation` | **FlipView** | 翻页时把离开的页从列表中删除、把新页插入列表（官方 FLIP） | `FlipView/_PageManager.js:1890, 1904` |
| | **Flyout 的次要命令区** | 展开/收起"更多命令"时命令的增删 | `Flyout/_Overlay.js:757, 760` |
| `createRepositionAnimation` | **AutoSuggestBox** | 候选列表**跟随输入框移动**后，内部项重新归位 | `AutoSuggestBox.js:525, 833, 1059` |
| | **FlipView** | 翻页后页根元素重排 | `FlipView/_PageManager.js:1915` |
| `enterContent` | **ListView** | 视图切换（列表↔网格）新内容进场 | `ListView.js:3835` |
| | **Hub** | 横向滚动到新的 Section 时视口内容进场 | `Hub.js:800` |
| | **FlipView** | 下一页内容进场（`mechanism:"transition"`） | `FlipView.js:1263` |
| `executeTransition` / `executeAnimation` | ListView / FlipView / MediaPlayer | **底层原语**：控件自己拼过渡（如媒体控制条淡入淡出），不走命名动画 | `ListView/_Layouts.js`、`ListView.js`、`FlipView.js`、`MediaPlayer.js` |
| `isAnimationEnabled` | Hub / ListView / SemanticZoom | 播动画前先判断系统是否关闭了动画 | `Hub.js`、`ListView.js`、`SemanticZoom.js` |

> 补充：`ToggleSwitch` 的那个 0.1s 滑块位移是纯 CSS（`styles-toggleswitch.less:82`），不走动画库。

---

## B. 页面级转场：官方枚举指名道姓的四选一

`WinJS.UI.PageNavigationAnimation`（WinJS 3.0+，[官方文档](https://learn.microsoft.com/en-us/previous-versions/windows/apps/dn624866(v=win.10))）：

```
{ turnstile: "turnstile", slide: "slide", enterPage: "enterPage", continuum: "continuum" }
```

| 枚举值 | 实际使用的动画 | 用在哪 |
|---|---|---|
| `turnstile` | `turnstileForwardIn/Out`、`turnstileBackwardIn/Out` | 同级页面之间的前进/后退（"转门"），前后关系明确时用 |
| `slide` | `slideUp` / `slideDown`、`slideRightIn/Out`、`slideLeftIn/Out` | 上下或左右方向的页面切换（如全屏图片翻页、向导流程） |
| `enterPage` | `enterPage` / `exitPage` | **默认选择**：新页进场、旧页无动画（或仅淡出） |
| `continuum` | `continuumForwardIn/Out`、`continuumBackwardIn/Out` | **层级缩放**：从缩略图放大到详情、从网格进入单页（"连续体"） |
| （不在枚举内，配套使用） | `drillInIncoming/Outgoing`、`drillOutIncoming/Outgoing` | **下钻**：列表项 → 详情页（`drillIn` 放大进场），返回时用 `drillOut` |

【源码】`createPageNavigationAnimations(currentPreferredAnimation, nextPreferredAnimation, movingBackwards)` 是这套枚举的入口。注意 WinJS 4.x 里它已被简化成桩：无论传什么参数都只返回 `{ exit: 空, entrance: enterPage }`（`js_WinJS_Animations.js:2632-2659`），要用全四种转场得直接调对应函数。

---

## C. 控件级交互：磁贴、列表、拖拽、滑动多选（给应用作者用）

| 动画 | 用在哪 | 场景说明 |
|---|---|---|
| `pointerDown` / `pointerUp` | **磁贴 / 列表项的按下反馈** | 按下缩到 `scale(0.975)`、抬起复位，167 ms。Win8 开始屏幕磁贴的手感就是它。**注意：WinJS 自己的控件 CSS 里没有这个缩放**，它是留给自绘磁贴的 API |
| `dragSourceStart` / `dragSourceEnd` | **拖拽源**（被拖走的磁贴） | 开始拖：源放大 `1.05` + 变 0.65 透明（"拿起来了"），其余项缩到 `0.95` 让位；放下：复位 |
| `dragBetweenEnter` / `dragBetweenLeave` | **落点指示** | 拖过两个元素之间时，显示"可以插到这里"（项让开并缩到 0.95）；不能落时用 `dragBetweenLeave` 复原 |
| `swipeSelect` / `swipeDeselect` / `swipeReveal` | **滑动多选** | Win8 磁贴"向下轻划选中"：`swipeReveal` 把选中框划出来，`swipeSelect`/`swipeDeselect` 把对象滑回原位 |
| `createExpandAnimation` / `createCollapseAnimation` | **展开 / 收起** | 展开详情、分组展开、行内插入内容；揭示项 167 ms 淡入 + 受影响项 367 ms 归位（内含 200/167 ms 延迟错开） |
| `createAddToListAnimation` / `createDeleteFromListAnimation` | **列表增删** | 新增项 `scale(0.85)→1` 120 ms；删除项缩小淡出 120 ms；其余项 400 ms 归位 |
| `createRepositionAnimation` | **重排** | 筛选、排序、拖拽落位后其他项平滑归位（367 ms，交错 `min(33×i, 250)`） |
| `createAddToSearchListAnimation` / `createDeleteFromSearchListAnimation` | **搜索建议 / 搜索结果** | 与普通列表区分：**更快**（117 ms / 93 ms，linear），因为搜索列表刷新频繁 |
| `crossFade` | **同一位置换内容** | 两段内容互换成另一段（各 167 ms linear）。官方设计指南明确说它"没有特定含义，可自由使用"，但**不能用它表示导航** |
| `updateBadge` | **磁贴徽章** | 磁贴角标数字更新，位移长达 **1333 ms** —— 那个视觉上很"重"的滑入，专门用来吸引注意 |
| `createPeekAnimation` | **窥视（Peek）** | 长按 / 悬停时的预览浮起（如任务栏预览、磁贴长按） |
| `enterContent` / `exitContent` | **内容区换内容** | 页内某块区域整体替换（导航栏切换、筛选结果区），位移 550 ms / 117 ms |

---

## D. 反查表：想改 Win8 的某个地方，该用哪条

| Win8 界面元素 | 该用 |
|---|---|
| 开始屏幕磁贴按下 / 抬起 | `pointerDown` / `pointerUp` |
| 磁贴徽章数字更新 | `updateBadge` |
| 底部 / 顶部 AppBar | `showEdgeUI` / `hideEdgeUI`（底部传正偏移、顶部传负偏移） |
| 设置面板（364px）/ 超级按钮侧栏 | `showPanel` / `hidePanel` |
| 浮出菜单、下拉候选 | `showPopup` / `hidePopup`（记得那 **83 ms 延迟**） |
| 工具提示 | `fadeIn` / `fadeOut` |
| 对话框 | 根节点 `fadeIn` / `fadeOut` + 遮罩 `fadeIn` / `fadeOut` |
| 页面导航（默认） | `enterPage` / `exitPage` |
| 页面导航（前后关系明确） | `turnstile*` |
| 页面导航（上下/左右推进） | `slideUp/Down`、`slideRight*/slideLeft*` |
| 页面导航（缩略图→详情） | `continuum*` |
| 列表项 → 详情页 | `drillIn*`（返回 `drillOut*`） |
| 列表 / 网格增删 | `createAddToListAnimation` / `createDeleteFromListAnimation` |
| 重排、筛选、拖拽落位 | `createRepositionAnimation` |
| 展开详情 / 分组 | `createExpandAnimation` / `createCollapseAnimation` |
| 搜索建议刷新 | `createAddToSearchListAnimation` / `createDeleteFromSearchListAnimation` |
| 拖拽磁贴 | `dragSourceStart/End` + `dragBetweenEnter/Leave` |
| 滑动多选 | `swipeReveal` → `swipeSelect` / `swipeDeselect` |
| 同位置内容替换 | `crossFade` |
| 长按预览 | `createPeekAnimation` |
| 页内内容区切换 | `enterContent` / `exitContent` |

---

## E. 选型时最容易犯的 5 个错

1. **把 `showEdgeUI` 的默认偏移用在底部 AppBar 上**。默认值是 `{top:"-70px"}`，那是给**顶部**边缘 UI 的；底部 AppBar 必须传正数（自身高度）。AppBar 控件自己就是这么算的：`offsetTop = placement === "top" ? -distance : +distance`。
2. **用 `crossFade` 表示"进入下一页"**。官方指南明确点名这是错误用法：交叉淡化没有方位含义，用户看完不知道自己去了哪儿；页面导航要用 `enterPage` / `turnstile` / `slide`。
3. **出场动画也用缓动曲线**。官方退场（`exitPage`、`exitContent`、`hidePopup`）统一是 **linear 117 ms / 117 ms / 83 ms**——出场要"干脆走掉"，不拖尾。
4. **给列表增删用 `fadeIn` 敷衍**。官方给列表准备的是 FLIP 组合动画（新增项 120 ms 缩放淡入 + 其余项 400 ms 归位），只用淡入会丢掉"其他项让位"这个关键信息。
5. **忽略"关闭动画"开关**。官方控件在播动画前会检查 `isAnimationEnabled`（Hub、ListView、SemanticZoom 都这么写）。移植版用 `Win8Anim.enabled = false` 和 `prefers-reduced-motion` 两条路径兑现。

---

## 数据来源

- 源码调用：`winjs/winjs` 仓库 `src/js/WinJS/Controls/**`、`src/js/WinJS/Animations.js`（MIT）
- 页面导航枚举：<https://learn.microsoft.com/en-us/previous-versions/windows/apps/dn624866(v=win.10)>
- 动画设计词汇表与"适用范围"原则：<https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/uxguide/vis-animations.md>
- 参数数值表：本目录 `official-values.md`
