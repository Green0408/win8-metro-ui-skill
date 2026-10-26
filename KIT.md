# Win8 / Metro 工具界面 KIT — 调用契约

> 本文件是给 AI 的**执行契约**：用户要求"用 Win8/Metro 那套 UI 生成 XX 工具界面"时，按本文件执行，
> 不要凭记忆重写动画参数。所有数值与用法的唯一来源是仓库里的官方源码与文档。

## 0. 怎么跟 AI 说（复制即用）

**最短一句**（其余我按本文件默认来）：

```text
照 win8-metro-ui 的 KIT 做一个「<工具名>」工具界面。
用途：<一句话>。列表项=<字段>，详情=<字段>，面板设置=<项>，应用栏命令=<项>。
```

**这一行每一项对应模板里的什么**（都只问"业务内容"，排版/几何/动画不用描述）：

| 你写的 | 对应模板里的位置 | 模板示例 | 没写会怎样 |
|---|---|---|---|
| 用途：一句话 | `<h1>工具名</h1>` 下的 `.sub` 说明行 | 「一句话说明这个工具做什么…」 | 保留占位文案 |
| 列表项=字段 | 主区左侧列表行（`makeRow()`：标题 + 行内「删除」命令） | `任务 1 / 任务 2 / 任务 3` | 保留 3 条示例任务 |
| 详情=字段 | 主区右侧详情（`renderDetail()`：`<h2>` + `<dl>` 键值对） | `状态 / 说明` | 保留示例字段 |
| 面板设置=项 | 属性面板内容（官方控件：开关 + **复选框** + 滑块 + 下拉框 + 进度条 + 说明） | 开关「列表面板跟随选中项」、复选框「列表行显示删除按钮」、滑块「行高」 | 保留这些控件示例 |
| 应用栏命令=项 | AppBar 上的 `.win-command` | 关闭应用栏 / 属性面板 / 关于 | 保留三条示例命令 |

**要精确控制时用这个填空**：

```text
按 KIT 生成工具界面：
- 工具名 / 页面大标题：
- 左侧导航项：<页1> / <页2> / 属性面板 / 关于
- 主区数据：列表项 = <字段…>；详情 = <字段…>
- 属性面板里的设置项：<开关/滑块/下拉/输入…>
- 应用栏（AppBar）命令：<…>
- 文案与语言：
- 需要偏离官方的点：<没有就写"无">
```

**填好之后长这样**（真实例子）：

```text
照 win8-metro-ui 的 KIT 做一个「图片批处理」工具界面。
用途：批量裁剪、压缩并导出图片。
列表项=文件名、尺寸，行内动作"移除"；详情=路径、原始尺寸、目标尺寸、预计体积；
面板设置=压缩质量滑块、保留元数据开关；应用栏命令=导入、导出、关于。
```

**几条省事的规则**：

- **一个词就够**，不用描述排版：字号/间距/行高走官方斜坡与官方几何（规则 17/18/19），不用你说"用 15px"。
- **要别的官方控件就点名**：现成有 按钮 / 命令 / 输入框 / 多行文本 / **复选框** / 单选 / 链接 / **开关** / **滑块** / **下拉框** / **进度条**；
  要进度环、Rating、对话框、搜索框、日期选择之类，我会**先把 WinJS 源码里的数值抄回来**再实现
  （完整的"已内置 / 未做"清单见第 19 条）。
- **要偏离官方就说**，我照做并在本文件登记（含改回官方的方法）。

**说了"按 KIT / 按官方来"就等于接受了这些默认**（不必再逐条交代，它们都已写进本文件与模板）：

| 已内置 | 内容 |
|---|---|
| 官方唯一权威 | 数值全部来自 WinJS 源码，结构与自适应来自 WinUI 文档；偏离必须在 `KIT.md` + 代码注释里登记 |
| 左侧导航 | 官方 SplitView：展开 **320px** / 折叠 **48px 图标条**；三档自适应 **≥1280（官方默认 1008，该属性官方允许改）/ 641–1007 / ≤640**；选中态=左缘指示条；设置入口在窗格底部；Minimal 档 52px 表头 + 浮层（汉堡留在表头里）|
| 转场 | 统一走 `transitionTo()`：busy 锁 + **插队**（动画没完也立刻切）+ 同目标守卫；页面分批 `enterPage`，**大标题独占批次 1** |
| 边栏 / 浮层 | 入口是**开关**（开↔关）；light-dismiss 排除两个入口；面板内容**标题 0ms 先到、其余 83ms 随后** |
| 控件 | 官方 `.win-button` / `.win-command` / `.win-textbox` / 复选框 / 开关 / 滑块，数值与 DOM 顺序都照官方源码 |
| 交付前必过 | `python3 check_ui_conventions.py <文件>`（20+ 条规则）· 无头桩 · `selftest.html` 显示 **ALL PASS** |

**我交付时会做的事**：复制 `win8-tool-starter.html` 改造 → 跑上面三项自检 → 在浏览器里实测几何与交互（拿不到截图，就量尺寸/命中测试/动画 delay）→ 报告里每条改动都注明官方出处与实测数字。

## 0.1 一分钟上手（最短路径）

```text
1. 复制 win8-tool-starter.html → 改成你的工具
2. 只改：<h1>/说明文字、工具栏按钮、列表数据、面板内容、AppBar 命令
3. 不要改：动画调用、transitionTo()、pageBatches()、分批偏移、APPBAR_OFFSET
4. 交付前跑：python3 check_ui_conventions.py <你的文件>
```

## 1. 必读（按顺序，别跳）

| 文件 | 读它干什么 |
|---|---|
| `KIT.md` | 本文件：硬性规则与骨架约定 |
| `win8-tool-starter.html` | **模板**，直接复制；动画接线已经写好 |
| `where-used.md` | 反查表："这个界面元素该用哪条动画" |
| `README.md` | 官方对齐原则、分批进入、挂钟兜底、两个必踩的坑 |
| `win8-animation-demo.html` | 全部动画的可跑示例，照抄调用方式 |
| `official-values.md` | 61 条动画的官方参数（需要核对数值时查） |

## 2. 引入方式（三个文件，无依赖）

```html
<link rel="stylesheet" href="win8-animation-library.css">  <!-- 官方关键帧 + 过渡值 -->
<link rel="stylesheet" href="win8-controls.css">           <!-- 官方按钮/输入框/字体斜坡 -->
<script src="win8-animations.js"></script>
<script>var A = Win8Anim;</script>
```

## 3. 硬性规则（`check_ui_conventions.py` 会检查）

1. **不手写动画数值**：不写 `cubic-bezier(...)`、不写 `animation: xxx 300ms`。要自定义关键帧就用
   `win8-animation-library.css` 里的官方 `WinJS-*` 关键帧与 `--winjs-ease-*` 变量。
2. **只调官方 API**：`A.` 后面的方法名必须是 `official-api-coverage.md` 里那 51 个之一
   （扩展只有 `settingsFlyoutSlideIn` / `EASE` / `stagger` / 调试开关）。
3. **页面骨架**：`<section class="page" id="..." aria-label="...">`；首个页面不带 `back`，
   其余带 `class="page back"`。`aria-label` 是硬性要求（无障碍 + 便于调试定位）。
4. **分批进入**：页内区域打 `data-batch="1|2|3…"`（顶层即批次，与官方 `enterPage` 语义一致）。
   **大标题独占批次 1**（不与副标题同批）→ 副标题批次 2 → 正文/列表批次 3 → 详情/次要区域批次 4，
   批次间隔为官方交错 `min(83 × i, 333)` ms（4 批即 0 / 83 / 166 / 249 ms）。
   官方文档示例是把 header 与它的 label 同批，**分区方式由应用自己决定**；本项目统一按"大标题独占"。
   官方《Animating page transitions (HTML)》原话：*"The new page is split into regions, and each region
   moves onto the screen separately, **with staggered timings**. **You specify how the incoming page is
   split into regions.**"* —— 区域划分权在应用、交错是官方的；实现里的参数就是
   `staggerDelay(0, 83, 1, 333)`（0 / 83 / 166 / 249ms…**上限 333ms**）。
   出处：[Animating page transitions](https://learn.microsoft.com/en-us/previous-versions/windows/apps/jj655417(v=win.10))。
   交互控件不参与分批（见规则 15）。
   ⚠ **`data-batch` 打在"要动的可见块"上**：带底色的卡片/框本身就是那一块，**别打在框里面的文字上**
   （那样框会瞬间出现、只有文字动，见规则 12 的症状）。纯布局用的包裹层（无底色）不用打。
5. **分批方向默认"从右往左滑"**：用 `contentOffset()` 给出 `{left:'100px'}`（官方 SettingsFlyout 的偏移值）；
   官方默认偏移是下移 28px，两者都合法，需要时提供切换。
6. **转场一律走 `transitionTo()`**：它负责 busy 锁、z-index、以及清理出场残留（见规则 9）。
   页面进场 = 该转场的官方动画（框架）+ `enterPage(批次数组, offset)`（分批内容）。
   ⚠ **动画没放完时的点击必须"插队"，不能丢**：官方 `enterPage` 有 **1000ms**，这个窗口里点导航
   很容易踩到。导航的高亮与表头标题是**点击那一刻就更新**的（乐观更新），所以一旦把点击丢掉，
   界面就停在"关于高亮着、页面还在工作台"这种自相矛盾的状态（真实反馈）。
   模板的做法（`transitionTo` 里，仍然是"同一时刻只有一次转场"）：

   1. 请求存进 `pending`（只留最后一个，连点不积压）；
   2. **立刻把正在跑的页面动画推到终态**（`finishPageAnimations`：对 `.page` 子树里的动画调
      `finish()`）→ 当前那次转场就地结算，排队的请求**在同一帧里起跑** ——
      实测：插队后 30ms（约 2 帧）新转场已在跑，不用等旧的 1000ms 放完。

   三个必须知道的坑：

   - **用 `finish()`，不要用 `cancel()`**：`cancel()` 会让动画的 `finished` 变 reject，
     `Promise.all([enter, exit])` 就永远不 then，`busy` 锁会卡死。
   - **只推 `.page` 子树里的动画**：边栏（550ms）、应用栏（367ms）那些不归转场管，
     顺手 finish 掉会变成"边栏还没滑进来就定住"。
   - ⚠ **必须有"同目标守卫"**（`inFlightTo`）：连点**同一个键**时目标跟正在切往的那页相同，
     这时**不能插队** —— 一插队就把用户正在看的那次进场动画直接拍成最终态
     （真实反馈："连续点击侧边栏同一个键，未完成的进入动画会直接显示最终状态"）。
     正确做法是直接 `return` 什么都不做，让动画自然放完；
     但要留一个例外：**已经插过队**（`pending` 有值）时不能直接 return，否则会把用户刚点的那一下丢掉。

   代价：被打断的动画是**补完到终态**而不是从半路倒回去，所以会有一帧的补完位移/淡入 ——
   这是官方动画的前提（它们的 `from` 是固定偏移，中途重入本来就该从头重跑）。
7. **边栏**：`A.settingsFlyoutSlideIn(panel, null, { contentSelector: '.win-content' })`
   （复刻官方 `SettingsFlyout._animateSlideIn`：框架 550ms + 内容逐区域进场）。
   **官方 flyout 的默认是"逐区域同时进场"**：官方对每个 `div.win-content` **各调一次** `enterPage`
   （`query("div.win-content").forEach(e => enterPage(e, {left: offset}))`），单元素调用批次号为 0
   → 区域之间没有交错。库里保留了这个默认：`{ contentSelector: '.win-content' }` 或传**扁平数组**时，
   逐区域同时进场（无头桩有断言守着）。

   **要交错就显式分批**（本模板属性面板就是这么做的）：面板内区域打 `data-batch="1|2…"`（与页面同一套约定），
   `openPanel` 里传**嵌套数组**：

   ```js
   var panelBatches = pageBatches(panelEl);          // 按 data-batch 分组 → [[标题], [其余+控件]]
   A.settingsFlyoutSlideIn(panelEl, null, panelBatches.length
     ? { content: panelBatches } : { contentSelector: '.win-content' });
   ```

   → 标题 **0ms** 先到、其余（文字 + 控件）**83ms** 随后，用的就是官方 `staggerDelay(0, 83, 1, 333)`
   的第 2 档。**官方明确允许这么划**：`Animating page transitions` 原文 *"…with staggered timings.
   You specify how the incoming page is split into regions."*（区域划分权在应用）。
   想回到官方 flyout 的"同时进场"：去掉面板里的 `data-batch` 即可（上面的兜底分支会自动走选择器）。

   ⚠ 控件（开关/滑块）官方**没有额外规定**：它们就是容器的内容（官方推荐表里"任何 UI 容器的内容 →
   `enterContent`"），所以跟着内容批次进场；`fadeIn` 是给"随命令条出现/消失、不随内容移动"的控件用的（规则 15）。
   ⚠ **入口必须是"开关"**（`togglePanel()`：开 ↔ 关），不是"只开"。两个坑一起踩过：
   - `openPanel()` 里没有防重入 → 连点会把进场动画**一遍遍重播**；
   - light-dismiss 当初只排除了 `[data-act="panel"]`，而窗格底部的入口是 `[data-nav="panel"]` →
     `pointerdown` 先把它关掉、紧接着 `click` 又开一遍，看起来同样是"动画在反复播"。
   两处都要改：入口走 `togglePanel()`、`openPanel()` 加防重入、light-dismiss 的排除列表同时写上两个选择器。
   另外**动作型入口不该改页标题/选中态** —— 它们只在真正切页时一起动。
8. **AppBar**：`A.showEdgeUI(appbar, APPBAR_OFFSET)` / `A.hideEdgeUI(appbar, APPBAR_OFFSET)`，
   偏移量 = 自身高度（底部为正、顶部为负）—— 官方默认 `-70px` 是给顶部用的，底部直接用会从屏幕上方掉下来。
9. **列表增删改用官方 FLIP 三段式**：`createXxx` 建对象（此时记录位置）→ 改 DOM → `execute()`。
10. **隐藏浮层不能只靠 `opacity: 0`**：透明元素仍参与命中测试，会把下面元素的点击全吃掉
    （本项目踩过：弹出菜单盖住磁贴，点 showPopup 没反应）。必须同时 `visibility: hidden`
    或 `pointer-events: none`。
11. **按钮外观必须来自官方 `.win-button`**（见 `win8-controls.css`）：方角、静止时边框透明、
    hover 只显边框、按下才加深底色。**不要自己写 `border: 1px solid …` + 深灰底色** —— 那是网页按钮，
    不是 Metro。**行内动作与应用栏命令**不是按钮，用 `.win-command`（无边框无底色，
    hover/press 取官方 `@listHover` / `@listPress` = `rgba(255,255,255,.1)` / `.2`）。
12. **分清两种动画，别把它们的做法搞混**（这是最常犯的错，症状很典型）：

    | 场景 | 谁动 | 做法 |
    |---|---|---|
    | **整页/区域入场**（`enterPage`）| **要动的那个可见块自己动** —— 带底色的卡片/框**就是**那一块，框和里面的文字一起进场 | `data-batch` 打在**框**上，**不要**打在框里面的文字上 |
    | **内容替换**（`enterContent`/`exitContent`，例如详情框换内容）| 外壳容器静止（保留底色/尺寸），只让里面的内容层动 | 外壳 = 有底色的 `.detail`，内容层 = `.detail-body`，动画给后者 |

    ⚠ **错法的症状**：把 `data-batch` 打在框**里面的文字**上 → **框会瞬间出现（没有入场动画），只有文字在动**
    （真实反馈："生成出来的 UI 老是背景框没入场动画，只有背景框上的文字有动画"）。
    原因：`enterPage(incoming)` 动画的就是你**传进去的元素**——传文字，动的就只有文字；
    传框，框（含它的底色）和里面的内容一起动。
    第二条那半句"容器静止"**只适用于内容替换**：外壳的底色跟着淡出会像黑板上闪一下，
    所以换内容时不动外壳；但**入场时外壳必须动**。
13. **浮层一律 light-dismiss**：应用栏、边栏、弹出菜单都要能"点其他任意位置收起"
    （官方 Win8 行为；AppBar 另配右键唤出）。实现见模板里统一的 `pointerdown` 处理。
14. **出场残留必须清**：出场动画（`exitContent`、各转场 `*Out`）会把整页 opacity 落到 0；
    分批进场只动画页内区域，所以进场前要清 `to.style.opacity/transform`，否则**黑屏**。
    `transitionTo()` 里已经处理好，别绕过它。

15. **控件不参与"内容分批滑入"**：分批内容走 `enterPage`（位移 **1000ms** + 淡入 170ms），
    曲线快起慢收 —— 对 32px 高的按钮来说，前 200ms 就走完九成、之后还要横向漂十几像素 800ms，
    看起来就是"已经全亮却还在慢慢挪"，非常生硬。官方对按钮/箭头一律用 **`fadeIn` / `fadeOut`**
    （源码依据：`NavBar/_Container.js` 箭头、`SemanticZoom.js` 缩放按钮、`FlipView.js` 翻页按钮）。
    做法：**控件容器加 `win-controls` 类**，并放在 `data-batch` 与 `.win-content` **之外**；
    `transitionTo()` 会对入场页里所有 `.win-controls` 自动做官方 `fadeIn`（模板已实现，照抄即可）。
    面板这类非页面转场的容器，在打开时自己调一次 `A.fadeIn(面板内 .win-controls)`。
    **同理适用于"被开关/复选框控制显隐的控件"**：属性面板里那个复选框控制行内「删除」按钮的显隐，
    显隐就走官方 `fadeIn`（250ms）/ `fadeOut`（167ms），不让它们跟着内容分批；复选框**本身**没有动画
    （它是内容，状态即时切换）。模板里 `setRowActions()` 就是这个写法，连点保护也做了。
16. **水平偏移用官方值**：`enterPage` 的 offset 官方推荐默认（下移 28px）；确实要水平进场时，
    用官方 `SettingsFlyout` 的 **±100px**，不要自己放大到 160px —— 偏移越大，那段"慢尾巴"越明显。

17. **排版一律用官方字体斜坡类**（`win8-controls.css`，取自 WinJS `font-definitions.less`），
    页面 CSS 里**不要再写 `font-size` / `font-weight`**：

    | 角色 | 类 | 官方值 |
    |---|---|---|
    | 页头 | `.win-type-header` | 46 / 200 / 1.216 |
    | 页面标题 | `.win-type-subheader` | **34 / 200 / 1.176** |
    | 区块标题 | `.win-type-title` | 24 / 300 / 1.167 |
    | 面板/区块副标题 | `.win-type-subtitle` | **20 / 400 / 1.2** |
    | 正文 | `.win-type-body` | **15 / 400 / 1.333** |
    | 强调正文 | `.win-type-base` | 15 / 500 / 1.333 |
    | 说明/注脚/标签 | `.win-type-caption` | **12 / 400 / 1.167** |

    色调与间距可以自己写（如 `.sub { color:#9a9a9a; margin:0 0 20px }`），字号字重交给斜坡。

18. **左侧导航：完全按官方规范实现**（模板已内置，照抄即可）。

    规范由**两份官方源**拼成，各管一段 —— 别把它们的数值混着用：

    | 来源 | 管什么 |
    |---|---|
    | **WinJS**（`src/less/styles-splitview*.less`、`colors-splitviewcommand.less`） | **所有数值**：宽度、行高、图标框、内距、字号、配色、焦点框 |
    | **WinUI NavigationView 文档** | **结构与自适应**：窗格有哪些部分、选中态怎么表达、三档断点、Minimal 表头 |

    ### 18.1 WinJS 的数值（一字不改）

    | 项目 | 官方值 | 出处 |
    |---|---|---|
    | 窗格宽度 | 展开 **320px**／收起 **48px**（图标条） | `styles-splitview.less` |
    | 开合动画 | **宽度变化错觉**：clipper 与 pane 反向平移 + `overflow:hidden`；放大 **350ms** / 缩小 **120ms**，曲线 `cubic-bezier(0.1,0.9,0.2,1)`；前 **30%** 尺寸变化瞬时（`animationOffsetFactor = 0.3`） | `_SplitView.ts` + `Animations._resizeTransition` + `getResizeDefaultTransitions()` |
    | 导航项行 | `.win-splitviewcommand-button-content`：**height 48px**、`padding-left/right 16px` | `styles-splitviewcommand.less` |
    | 图标框 | **16×16**、`font-size 16px`、`margin-top 14px`（官方注释 "Center icon vertically"）、`margin-right 16px`、`line-height 1` | 同上 |
    | 文字 | `._win-type-body()` = **15px/400**、`line-height 1.333`、`margin 13px 0 15px`（20+13+15 = 48px 行高） | 同上 |
    | 配色 | 静止 `transparent` + `@baseHigh` 文字；hover `@listHover`；按下 `@listPress` | `colors-splitviewcommand.less` |
    | 键盘焦点 | `.win-keyboard:focus::before`：**1px dotted `@baseHigh`** 铺满条目（Web 里用 `:focus-visible`） | 同上 |
    | 菜单按钮 | **48×48**；字形 `\E700`、**font-size 24px** | `styles-splitviewpanetoggle.less` |

    ⚠ **三个数一起构成行几何，别单独改**：行高 48px 是图标条几何（图标 x∈[16,32]、文字正好从 x=48 被裁）
    和 `resizeTransition` 数学的前提；图标 `margin-top` 官方就是 **14px**，不要"顺手改成 16 看起来更居中"
    —— 官方是拿它去对齐标签盒（13..33）的，改了反而和文字错位。

    ### 18.2 WinUI 文档的结构（WinJS 的窗格是空容器，这些由应用定）

    | 项目 | 官方规定 | 实现 |
    |---|---|---|
    | 窗格内容 | 菜单按钮 + **PaneTitle**（*"shows the text next to the menu button"*）+ 条目 + 设置入口 | 表头行 48px 放菜单按钮 + `工具名` |
    | 设置入口 | *"an optional entry point for app settings"*，且 *"FooterMenuItems will be displayed before the `Settings` item by default"* | 「属性面板」放在 `.win-splitview-panefooter`（`margin-top:auto` 顶到窗格底部） |
    | 选中态 | *"Selected items will draw their selection indicators **along their left edge** when in left mode"* | `[aria-current="page"]::after`：左缘 **2px** 指示条，高度占满条目 |
    | 自适应三档 | ≥**1280px**（官方默认 1008，本模板已调高）`Left`／**641–1007px** `LeftCompact`／≤**640px** `LeftMinimal` | 见 18.3 |

    指示条的**几何来源**说清楚：文档只规定了"贴在条目左边"，没给尺寸；所以宽度取官方 Metro 的 **2px 边宽**
    （`.win-button` 的 2px border、高对比度下导航项也是 2px），高度取官方 **48px 行高**。
    颜色是**应用的强调色** —— WinJS 从不定义强调色（官方把 0.6 不透明度的强调色留给应用提供），
    所以模板用 `--win-accent` 变量，默认白色维持本库单色观感，换品牌色只改这一个变量。

    ### 18.3 自适应三档的行为

    | 窗口宽度 | 官方档位 | 模板行为 |
    |---|---|---|
    | **≥1280px**（官方默认 1008） | `Left` | 窗格固定展开、与内容**并排**（内容让出 320px）、**不可收起**（只隐藏菜单按钮，表头行/PaneTitle 留着）、点内容区/导航项都不收起 |
    | **641–1007px** | `LeftCompact` | **48px 图标条**（菜单按钮占首格）；点开后**覆盖**内容（官方 "When opened, the pane overlays the content"） |
    | **≤640px** | `LeftMinimal` | 窗格**整个收起**；内容区顶部一条 **52px 表头**放菜单按钮 + 页标题，点开窗格是**浮层**盖住内容 |

    三条容易做错的细节（都已实现）：

    1. **只在跨过档位时**套用官方默认值 —— 同一档内改窗口大小不能把用户刚手动收起的菜单又弹开。
    2. **Minimal 的浮层不含表头**：官方原文是覆盖 **content**，表头不属于 content —— 所以窗格 `top:52px`
       从表头下沿开始，**展开时汉堡键依然可见、可再点一次收起**（命中测试实测）。另外两档窗格照旧贴窗口顶边（`top:0`）。
    3. **别只挂 `resize`**：`resize` / `matchMedia.change` / `ResizeObserver` 全是帧驱动的，
       窗口被遮挡时一个都不会派发（实测三者全哑，而 `innerWidth` 读数一直是对的）；
       模板因此加了一道 250ms 低频轮询兜底，只读宽度、状态没变立刻返回。

    阈值出处：[NavigationView](https://learn.microsoft.com/en-us/windows/apps/design/controls/navigationview) ·
    [Screen sizes and breakpoints](https://learn.microsoft.com/en-us/windows/apps/design/layout/screen-sizes-and-breakpoints-for-responsive-design)。

    ### 18.4 为什么"条目不再贴顶"

    以前窗格第一个东西就是条目，所以条目离窗口顶边只有十几像素、看着挤。官方结构里
    窗格最上面是**表头行**（菜单按钮 + PaneTitle，48px），条目从这一行**之下**开始 ——
    这是官方节奏，不是靠额外内边距凑的（早先版本用过一个自创的 12px 内边距，现已删除）。

    ### 18.5 调用与三个坑

    配套的一条（真实反馈："窄窗口下属性面板上方被顶部栏遮挡"）：
    **应用级浮层（AppBar / 边栏 / 弹出菜单）必须放在 `.win-splitview-content` 之外**，
    挂到 `.win-splitview`（`#stage`）下。因为内容区一旦自成层叠上下文，
    里面的元素 **z-index 再大也只在那一层里比**，整层（z-index 0）依旧低于表头（z-index 1）——
    边栏 `z-index: 6` 照样会被 52px 表头盖住顶上一条。把它们挪到 `#stage` 下，
    就成了"浮层(6/5/7) vs 内容层(0)"，浮层在上、表头在内容层里，层级自然正确；
    几何不受影响（两者的包含块都是整窗，实测三档 `#panel 364×860`、`#appbar 全宽×78`、`#popup 36,180` 都没变）。

    ⚠ **坑：内容区必须自成层叠上下文**（`.win-splitview-content { z-index: 0 }`）。
    页面转场会给页面挂 z-index（`transitionTo` 用 1 / 2），而 Minimal 档那条 52px 内容区表头
    （菜单按钮 + 页标题）就在同一个父层里 —— 不隔开的话**页面会盖住表头**，
    表现就是"跳到某一页之后汉堡键消失了"（实测：`elementFromPoint` 在按钮中心命中的是 `.page`）。
    给内容区一个 `z-index: 0` 就有了自己的层叠上下文，页面用多大 z-index 都关在里面，
    表头永远在上面。`check_ui_conventions.py` 里有一条 KIT 不变量守着它。

    调用：`A.resizeTransition(clipper, pane, { from, to, actualSize: 320, dimension: 'width', anchorTrailingEdge: false })`
    —— `resizeTransition` 是**官方 `WinJS.Utilities._resizeTransition` 的移植**（官方放在 Utilities 而非 Animation 命名空间）。

    **用 `<button>` 实现导航项时必须清零 UA 内边距**：官方把 `.win-splitviewcommand-button` 套在 `<div>` 上，
    没有 UA 内边距；用 `<button>`（无障碍更好）时浏览器默认 `1px 6px` 会让行高变 50px、
    图标与文字整体右移 6px，图标条几何全错。模板里已 `padding: 0; margin: 0; border: 0; appearance: none`。

19. **官方控件清单**（`win8-controls.css` 已内置，模板属性面板里有可运行的例子）。

    **已内置**：按钮 `.win-button` · 命令 `.win-command` · 输入框 `.win-textbox/.win-textarea`
    · **复选框 `.win-checkbox`** · 单选 `.win-radio` · 链接 `.win-link` · **开关 `.win-toggleswitch`**
    · **滑块 `.win-slider`** · **下拉框 `.win-dropdown`** · **进度条 `.win-progress-bar`**
    · 小工具类 `.win-code / .win-type-ellipsis / .win-scrollview`
    · 左侧导航（SplitView 全套）。

    | 控件 | 官方数值（出处） |
    |---|---|
    | 复选框 | **20×20**、边框 **2px**、`margin: 12px 8px 12px 0`（右边那 8px 就是"框与文字的距离" → **框在前、文字在后**）；配色：静止 `@baseMediumHigh` 边 + 透明底，勾选 = **应用强调色底 + `color:#fff` 勾**，悬停 `@baseHigh` 边，按下 `@baseMid` 底，禁用 `@baseLow`（`styles-intrinsic.less` §Radio and check + `colors-intrinsic.less` §Radio and Checkbox；勾选底色出自强调色规则，见下）。⚠ 官方靠 `::-ms-check` 由系统画（圆角、勾、半选横杠都是系统给的）→ 本库用 `appearance:none` 复刻：方角 + 自绘 10×10 白色 SVG 勾 + 自绘 10×2 半选横杠，并补一条官方没写的 `vertical-align: middle` |
    | 下拉框 | `min-width 56 / max-width 368 / min-height 32 / margin 8px 0 / border 2px / 方角`；文字 `_win-type-body()`；色 `@baseLow` 底 + `@baseMediumMid` 边，hover `@chromeMediumMid` + `@baseMid`；选中项 `@baseWhite` 字 + **强调色底**（`styles-intrinsic.less` + `colors-globalIntrinsics.less` + 强调色规则）。⚠ 官方箭头是 `select::-ms-expand`（IE 专属），Chromium/Safari 没有 → 自绘箭头，右边距按官方 5px |
    | 进度条 | `180×4`；`.win-medium` 296 宽、`.win-large` 100% 宽；不确定态跑官方关键帧 `win-progress-indeterminate`（3s linear infinite）；`.win-paused` 用官方 `win-progress-fade-out`（3s `cubic-bezier(0.03,0.76,0.31,1.0)`）→ opacity .5；确定态轨道 `@baseLow`（`styles-intrinsic.less` + `colors-intrinsic.less`）。填充段 = **应用强调色**（强调色规则里的 `::-webkit-progress-value` / `::-moz-progress-bar`） |
    | 输入框 · 焦点 | 官方 hover **底色也变**（`@altMid`）；focus 是 **白底黑字**（`@baseWhite`/`@baseBlack`，与主题无关的常量 —— Win8"一聚焦就变白"就是这条）+ **强调色边框**（强调色规则） |
    | 链接 | `text-decoration: underline` + `touch-action: manipulation` + **颜色 = 强调色**；hover `@baseMid`、active `@baseMediumMid`、禁用 `@baseLow`（`styles-intrinsic.less` §Link + 强调色规则 + `colors-intrinsic.less`） |
    | 未做（想要就说） | 提示气泡 `.win-tooltip`（**做过，按你的要求删了**：`styles-tooltip.less` + `colors-tooltip.less`，进出场官方 `fadeIn`/`fadeOut`，要就说一声）；`.win-ring` 进度环（官方几何可抄：20/40/60px，但"转圈"是 IE 的 `-ms-ring` 系统原语画的，CSS 抄不到，只能自绘替身）；Rating 星级；ContentDialog；SearchBox/AutoSuggestBox；DatePicker/TimePicker；NavBar |



    | 控件 | 官方数值 | 出处 |
    |---|---|---|
    | 开关 · DOM | **`header` → `clickregion`（内含 `track` **然后** `values`）→ `description`**；容器 `role="checkbox"` + `aria-checked` + `aria-labelledby`，`header`/`values` 都 `aria-hidden` | `ToggleSwitch.js` 渲染的模板 |
    | 开关 · 轨道 | **44×20**、边框 **2px**、圆角 **10px** | `styles-toggleswitch.less` |
    | 开关 · 滑块 | **⌀10**；OFF `left: 3px`、ON `left: 27px`（= (20−4−10)/2 与 44−10−2−5） | 同上 |
    | 开关 · 过渡 | 滑块 `transition: left **0.1s**`（官方唯一一条过渡；拖拽时加 `.win-toggleswitch-dragging` 去掉它） | 同上 |
    | 开关 · 文字 | 表头 `_win-type-body()`（15px/400）；取值文字高 = **轨道高 20px**、左距 **12px** | 同上 |
    | 开关 · 配色 | 关 = `@baseMediumHigh`；按下 = 滑块 `@baseWhite` + 轨道 `@baseMid`；禁用 = `@baseLow`；开 = 滑块 `@baseWhite`、边框透明、**轨道用应用强调色** | `colors-toggleswitch.less` |
    | 滑块 | 官方把它当**固有元素**（`input[type=range].win-slider`，WinJS 没有 Slider 控件类）：**280×44**、轨道高 **2px**、滑块 **8×24** 圆角 **4px**、`margin-top: −11px` | `styles-intrinsic.less` |
    | 滑块 · 配色 | 轨道 `@baseMediumMid`（hover `@baseMid`）；滑块白（hover `@sliderThumbHover #f9f9f9`、按下 `@chromeHigh #767676`、禁用 `#333`） | `colors-intrinsic.less` · `colors-globalIntrinsics.less` |

    **两条容易踩的**：

    1. **强调色由应用提供** —— WinJS 的 less 里从不定义它：开关 ON 态官方只写
       `border-color: transparent`，把轨道背景留给应用（高对比度分支里那句注释
       "Override Accent Color styles" 就是证据）。**哪些地方吃强调色，官方是在
       `src/js/WinJS/Controls/IntrinsicControls.js` 的强调色规则里逐条列的**
       （本库已把该文件归档进 `raw/js_WinJS_IntrinsicControls.js`）：
       复选框勾选态底色 / 复选框半选与单选勾选态的边框 / 文本框 focus 边框 /
       链接文字色 / 下拉框选中项底色 / 进度条填充段 / 开关 ON 态轨道 / 导航选中指示条。
       本库统一用 `--win-accent` 一个变量，默认 `#60CDFF` 是**本库给的默认值**、不是 WinJS 的值。
       ⚠ 别设成白色：ON 态的白滑块会在白轨道上看不见，勾选框的白勾也会消失。
    2. **滑块的"已填充段"官方只对 IE 定义**（强调色规则里的
       `.win-slider::-ms-fill-lower { background: <accent> }`；`colors.less` 高对比度分支给的是
       `Highlight`）。WebKit **没有**填充段伪元素，所以"轨道 + 滑块"就是官方在 WebKit 下的完整样子，
       本库不多加一层填充条；真想要 Win8 那种强调色填充，Firefox 有 `::-moz-range-progress` 可补，
       Chromium 得自己叠一层元素。

    **官方那张"自定义控件该用哪条动画"的表**（`Animating your UI` → "Using animations with custom controls"）：

    | UI 类型 | 官方推荐 |
    |---|---|
    | 对话框 / Tooltip | `fadeIn` + `fadeOut` |
    | Flyout / 上下文菜单 | `showPopup` + `hidePopup` |
    | Command bar | `showEdgeUI` + `hideEdgeUI` |
    | Task pane / 边缘面板 | `showPanel` + `hidePanel` |
    | **任何 UI 容器的内容** | **`enterContent` + `exitContent`**（可分批，见规则 4） |
    | **控件，或没有更合适的** | **`fadeIn` + `fadeOut`** |

    出处：[Animating your UI (HTML)](https://learn.microsoft.com/en-us/previous-versions/windows/apps/hh465165(v=win.10))。
    注意"容器的内容"与"控件"是两行：开关/滑块**放在内容里** → 按内容进场（可以分批）；
    独立出现、不随内容移动的控件（命令条上的按钮等）→ `fadeIn`。

20. **打开页面就播首屏入场**（"首屏要动"是**本项目约定**，不是官方值 —— 但参数全是官方的）。

    ⚠ 先说清官方立场：`enterPage` 的官方用途是**页面导航**；应用**首屏**在 Win8 里是系统闪屏
    （splash screen）交棒的，官方没有规定"首屏要播一次 enterPage"。所以这条是本 KIT 给你加的约定，
    不是官方规范 —— 不想遵守就删掉 `data-enter-on-load` 标记并写 `kit-lint-ignore` 说明原因。

    做法（模板与演示页都已内置，照抄这两段即可）：

    ```html
    <section class="page" id="mainPage" aria-label="主页面" data-enter-on-load>…</section>
    ```

    ```js
    var bootPage = document.querySelector('.page[data-enter-on-load]');
    if (bootPage) {
      var bootBatches = pageBatches(bootPage);
      if (bootBatches.length) { A.enterPage(bootBatches, contentOffset(false)); }   // 从右往左滑 100px → 0
      A.fadeIn(bootPage.querySelectorAll('.win-controls'));                        // 控件仍是官方 fadeIn
    }
    ```

    - **偏移用 `contentOffset(false)`：从右往左滑 100px → 0**，与页面转场同一套
      （`{top:'0px', left:'100px'}` → 库里的 `offsetToTransform` 会拼成 `translate(100px, 0px)`）。
      ⚠ 官方 `enterPage` 的**默认**偏移是"下移 28px → 0"（`offset ? offsetToTransform(offset) : 'translateY(28px)'`）——
      首屏走横向是**这条项目约定的一部分**（用户要求"打开页面入场动画同样要用从右往左运动的"），
      不是官方规定；**想退回官方默认就把第二个参数去掉**。
    - 分批仍是页面上那套 `data-batch`（模板：标题 0ms / 说明 83ms / 列表 166ms / 详情 249ms），
      交错用官方 `min(83×i, 333)` —— 与转场完全同一套参数，不新造值。
    - **不要走 `transitionTo()`**：首屏没有出场页，而且它会按顺序给页面挂 z-index（1/2），
      挂上就盖住 Minimal 档那条 52px 表头（规则 18 的坑）。
    - `prefers-reduced-motion: reduce` 与 `A.enabled = false` 时库会自动跳过、直接落终态，
      不用自己判断。
    - `check_ui_conventions.py` 有**两条**守着：① 页面上要有 `data-enter-on-load`，且脚本里紧跟一次
      `enterPage` / `enterContent` / `settingsFlyoutSlideIn`；② 那次调用要**带横向偏移**
      （`contentOffset(…)` 或显式 `{left: …}`），否则就是官方默认的"下移 28px"，与转场观感不一致。

21. **虚线焦点框只给键盘**（`check_ui_conventions.py` 会检查）。

    官方写的是 `:focus`（`raw/less_styles-toggleswitch.less:85`：`&:focus { .win-toggleswitch-clickregion
    { outline-width: 1px; outline-style: dotted; } }`）—— 那个年代还没有 `:focus-visible`，
    于是**鼠标点一下开关也会冒出一圈虚线框**（真实反馈："点开关时的虚线框"）。
    本库统一改成 **`:focus-visible`**：键盘 Tab 仍有官方那圈 1px dotted，鼠标点击不再出。
    同一个理由，导航项本来就用 `:focus-visible`（官方 `.win-keyboard:focus` = "键盘操作中"）。
    审查规则：任何"画虚线框"的规则的**选择器里出现 `:focus` 而不带 `:focus-visible`** 就判失败。

    ⚠ 两处**本库补充**的焦点提示（官方 less 里没有，因为官方靠 `::-ms-check` 的原生焦点视觉，
    而它们都 `appearance: none` 把原生焦点环去掉了）：

    - **复选框 / 单选**：`:focus-visible { outline: 1px dotted @baseHigh }`（浅色主题下换黑边）。
      实测：鼠标点 → 无框；真实 Tab → 那圈虚线框出现 ✓
    - **下拉框**：**不用虚线框，用强调色边框** + `outline: none`。
      原因（实测出来的）：`<select>` 在 Chrome 里算"支持键盘输入的表单控件"，
      **鼠标点一下也命中 `:focus-visible`**（探针读数 `:focus-visible=true`、`ring=dotted/1px`）——
      光换成 `:focus-visible` 挡不住它。而看官方做法：固有控件就是"`outline: 0` + 自己画指示"
      （`.win-textbox`、`.win-toggleswitch` 根都有 `outline: 0`），焦点指示用强调色边框
      （强调色规则里的 `.win-textbox:focus { border-color: <accent> }`）。下拉框照这一族实现。

    审查规则只认"画虚线框的规则"：选择器里出现 `:focus` 却不带 `:focus-visible` 就判失败
    （下拉框现在不画虚线框，自然不受影响）。

## 4. 常用调用一览（复制即用）

```js
// 页面转场（含分批内容）
transitionTo('detailPage', enterBatched(to, false), function (from) { return A.exitContent(from); },
             '进入详情', '分批进场');

// 按官方枚举挑转场：turnstile / slide / enterPage / continuum（+ drillIn）
var nav = A.createPageNavigationAnimations('turnstile', 'turnstile', false);
nav.entrance(page); nav.exit(oldPage);

// 列表增删改
var anim = A.createAddToListAnimation([newRow], existingRows);
list.insertBefore(newRow, list.firstChild);   // 或 appendChild
anim.execute();

// 重排 / 展开 / 删除
A.createRepositionAnimation(rows).execute();
A.createExpandAnimation([detail], affected).execute();
A.createDeleteFromListAnimation([row], remaining).execute();

// 边栏 / AppBar / 弹出菜单 / 提示
A.settingsFlyoutSlideIn(panel, null, { contentSelector: '.win-content' });
A.showEdgeUI(appbar, APPBAR_OFFSET);  A.hideEdgeUI(appbar, APPBAR_OFFSET);
A.showPopup(popup);                   A.hidePopup(popup);
A.fadeIn(tip);                        A.fadeOut(tip);

// 磁贴 / 列表项按下反馈
A.pointerDown(item);  A.pointerUp(item);

// 调试开关（官方命名，交付前关掉）
A.slow = true;              // ×3 慢放审阅
A.isAnimationEnabled = false; // 等价于系统"关闭不必要的动画"
```

## 5. 交付前自检（三步都要过）

```bash
python3 check_ui_conventions.py 你的文件.html     # 静态规范检查
# 浏览器打开 selftest.html → 标题应为 ALL PASS（库自身回归）
# 浏览器打开你的界面 → 点一遍所有命令，控制台零报错
```

## 6. 不要做的事

- ❌ 凭记忆写 `cubic-bezier(0.1,0.9,0.2,1)` 之类数值 —— 用库里的常量/动画方法。
- ❌ 给 `showEdgeUI` 用官方默认偏移去驱动底部 AppBar。
- ❌ 用 `crossFade` 表示"进入下一页"（官方设计指南明确点名这是错误用法）。
- ❌ 出场动画套缓动曲线（官方退场统一 linear）。
- ❌ 把分批用成"每个元素一批"（官方是**按区域**分批，通常 3 批以内）。
- ❌ 绕过 `transitionTo()` 自己切 `.back` 类（会遇到残留 opacity 黑屏）。

## 7. 需要偏离官方时

先查 `official-api-coverage.md` 确认官方确实没有该能力，然后：
在代码注释里写明「**非官方扩展：<原因>**」，并在 `README.md` 的扩展清单里登记。
本项目已有先例：`settingsFlyoutSlideIn`（官方是控件方法，不在 Animation 命名空间）、
挂钟兜底（官方用 CSS 过渡不会卡住，WAAPI 会）。
