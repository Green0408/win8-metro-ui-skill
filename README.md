# Win8 / Metro UI KIT

**这是一个 Agent Skill。** 装上之后，对 AI 说「照 KIT 做一个 XX 工具界面」，它就会用 Win8 官方动画参数
（时长 / 延迟 / 缓动曲线 / 关键帧）和官方控件几何去生成界面，而不是凭记忆瞎编数值。

把 Win8 / Metro 的官方规格整理成一套可执行的 KIT：**模板 + 规范检查器 + 官方数值表**。

- **类型**：Agent Skill —— 根目录 `SKILL.md` 带 `name` / `description` 头信息，属于「一个目录即一个技能」的约定，
  识别方式是 `SKILL.md`，不是某个平台专属格式
- **触发**：说「照 KIT 做一个「<工具名>」工具界面」即可，细节见 `SKILL.md`
- **安装**：克隆到 skills 目录，无依赖、无需构建（见下）
- **许可**：MIT，见 `LICENSE`；`raw/` 为微软 WinJS 源码节选，保留原 MIT 声明

## 安装

```bash
git clone https://github.com/Green0408/win8-metro-ui-skill.git ~/.workbuddy/skills/win8-metro-ui
```

| 工具 | skills 目录 |
|---|---|
| WorkBuddy | `~/.workbuddy/skills/` |
| Claude Code | `~/.claude/skills/` |
| 其他支持 `SKILL.md` 的 Agent | 放进该工具约定的 skills 目录，保证 `SKILL.md` 在目录根 |

放进去后**新开一个会话**生效——`SKILL.md` 头部的 `description` 就是它的触发条件，不需要额外注册。

## 一句话使用

```text
照 KIT 做一个「<工具名>」工具界面。
用途：<一句话>。列表项=<字段>，详情=<字段>，面板设置=<项>，应用栏命令=<项>。
```

交付前跑 `python3 check_ui_conventions.py <生成的文件.html>`，要求「合计未通过：0」。

## 目录里都是什么

| 文件 | 作用 |
|---|---|
| `SKILL.md` | 技能入口（frontmatter 定义 name / description） |
| `KIT.md` | 给 AI 的执行契约：骨架、分批、边栏、AppBar、控件清单 |
| `win8-compose.md` | 动手前先定模块：5 个问题 → A/B/C/D 四套处方 |
| `win8-tool-starter.html` | 可拆装的界面模板（复制它改业务） |
| `win8-animations.js` / `win8-animation-library.css` / `win8-controls.css` | 三个必需资产，与模板同层引用 |
| `official-values.md` / `.json` | 61 条命名动画 + 102 条过渡的官方参数表 |
| `where-used.md` / `official-api-coverage.md` | 反查表：这个元素该用哪条动画 / 哪些 API 官方确实提供 |
| `check_ui_conventions.py` | 规范检查器：把 KIT 规则可执行化，交付前必跑 |
| `selftest.html` / `win8-animation-demo.html` | 自检页 / 动画演示页（可在线看） |
| `raw/` | WinJS 官方源码节选，所有数值的唯一来源 |

## 在线看效果

- 动画演示：https://green0408.github.io/win8-metro-ui-skill/win8-animation-demo.html
- 界面模板：https://green0408.github.io/win8-metro-ui-skill/win8-tool-starter.html
- 自检页：https://green0408.github.io/win8-metro-ui-skill/selftest.html

---

以下为原始调研记录。

---

# Windows 8 官方 UI 动画 — 抓取与复刻

**结论：能拿到。** 但"官方 UI 动画"分三层，可获取性完全不同：

| 层 | 内容 | 能否拿到 | 本目录里的东西 |
|---|---|---|---|
| ① 官方动画参数（时长 / 延迟 / 缓动曲线 / 关键帧） | WinJS 动画库 `WinJS.UI.Animation` 的完整实现 | ✅ 能，微软以 **MIT 许可**开源在 GitHub | `raw/` 原始源码 + `official-values.md` 全量参数表 |
| ② 官方关键帧与控件过渡值 | `WinJS-*` 关键帧、磁贴/列表的过渡值与曲线 | ✅ 能，同一仓库 | `win8-animation-library.css` |
| ③ Win8 系统自身的动画资源 | 开机动画（旋转小圆点 + 徽标）、超级按钮、开始屏幕磁贴、开机音效 | ⚠️ 只存在于系统二进制里（`bootres.dll`、`imageres.dll` 等），微软未开放授权，**不能再分发** | 未收录，见文末说明 |

> 换句话说：**动画的"官方规格"完全可以合法拿到并且已经拿到了**；但 Win8 自己开机那几秒的动画属于操作系统资源，不是可下载的资产包。

---

## 拿它生成新界面（一句话）

```text
照 win8-metro-ui 的 KIT 做一个「<工具名>」工具界面。
用途：<一句话>。列表项=<字段>，详情=<字段>，面板设置=<项>，应用栏命令=<项>。
```

这几个空格分别对应模板里的：**用途**→标题下的说明行；**列表项**→左侧列表每行的字段（+行内动作）；
**详情**→点一行后右侧显示的键值对；**面板设置**→属性面板里的控件；**应用栏命令**→AppBar 上的命令。
一个词就够，不用描述排版（字号/间距/几何都按官方）。每一项的对照表与填好的例子见 `KIT.md` 第 0 节。

模板是 `win8-tool-starter.html`，硬性规则见 `KIT.md`（第 0 节有"怎么跟 AI 说"的填空模板与已内置默认清单），
交付前跑 `check_ui_conventions.py`。

---

## 目录内容

```
win8-metro-ui/
├─ KIT.md                      ★ 给 AI 的调用契约：触发方式、硬性规则、骨架约定、交付自检
├─ win8-tool-starter.html      ★ 工具界面模板：复制它改业务，动画接线已写好
├─ check_ui_conventions.py     ★ 规范检查器：静态校验生成结果是否合规（KIT.md 的规则可执行化）
├─ official-values.md          61 条命名动画 / 102 条过渡的官方参数表（自动生成）
├─ official-values.json        同一份数据的 JSON 版，便于程序读取
├─ where-used.md               每条动画**用在哪里**：控件源码调用点 + 官方枚举 + 反查表
├─ official-api-coverage.md    官方 API 逐条覆盖对照（51/51，0 缺失），由脚本生成
├─ check_api_coverage.py       重新生成上面这份对照表的脚本
├─ extract_table.py            从官方源码重新生成上述两个文件的脚本
├─ win8-animations.js          官方动画库的现代移植（50 个方法，参数逐条对齐官方）
├─ win8-animation-library.css  官方关键帧 + 官方控件过渡值（去掉 IE10 前缀副本）
├─ win8-controls.css           官方固有控件样式：按钮/输入框/复选框/字体斜坡（取自 WinJS 源码）
├─ win8-animation-demo.html    全量交互演示：4 个页面 / 20 个磁贴 / 5 种转场 / 2 组手势，
│                             每个磁贴标注**官方参数**与**用在哪**
├─ selftest.html               自检：45 条动画在真实浏览器里断言时长/延迟/曲线 + 末态落位
└─ raw/                        微软官方原始文件（MIT），未做任何修改
   ├─ js_WinJS_Animations.js              命名空间 WinJS.UI.Animation 全部实现
   ├─ js_WinJS_Animations__TransitionAnimation.js   底层执行器（含 _animationFactor 开关）
   ├─ less_animation-library.less         全部官方关键帧
   ├─ less_styles-listview.less           列表过渡值（250ms / 167ms / 220ms）
   ├─ less_styles-toggleswitch.less       开关几何（44×20 / ⌀10）
   ├─ less_styles-intrinsic.less          固有控件几何（按钮/输入框/**复选框 20×20**/下拉框/进度条/滑块/链接）
   ├─ less_colors-intrinsic.less          固有控件配色（含复选框勾选/半选/按下/禁用四态）
   ├─ less_colors-globalIntrinsics.less   下拉框、滑块等全局固有控件配色
   ├─ less_color-definitions.less         颜色 token（@baseHigh / @baseMid / @baseLow …）
   ├─ less_font-definitions.less          字体与字号斜坡（46/34/24/20/15/12）
   ├─ less_colors-toggleswitch.less       开关配色
   ├─ js_WinJS_IntrinsicControls.js       **强调色规则**：哪些控件吃应用强调色，逐条列在这里
   └─ less_styles-{appbar,contentdialog,flipview,semanticzoom,tooltip}.less
```

`raw/` 里的文件来自 <https://github.com/winjs/winjs>（`src/js/WinJS/Animations.js`、
`src/js/WinJS/Animations/_TransitionAnimation.js`、`src/less/*.less`），版权归 Microsoft，
MIT 许可，可自由用于商业项目，保留许可声明即可。

---

## 最常被问到的几条官方数值

| 动画 | 官方参数 |
|---|---|
| **主力缓动曲线** | `cubic-bezier(0.1, 0.9, 0.2, 1)` —— WinJS 里出现频率最高的那条 |
| 磁贴按下 / 抬起 `pointerDown` / `pointerUp` | 167 ms，终点 `scale(0.975, 0.975)` |
| 页面进场 `enterPage` | 位移 `translateY(28px)→0` **1000 ms** + 淡入 **170 ms**，多个元素交错延迟 `min(83×i, 333)` ms |
| 页面退场 `exitPage` | 117 ms **linear**（退场用线性，不走曲线） |
| 内容进场 / 退场 `enterContent` / `exitContent` | 550 ms / 117 ms |
| 顶边 UI `showEdgeUI` / `hideEdgeUI` | 从 `translateY(-70px)` 归位，367 ms |
| 设置面板 `showPanel` / `hidePanel` | 从右侧 `translateX(364px)` 滑入，550 ms（364px 就是 Win8 设置面板宽度） |
| 弹出菜单 `showPopup` / `hidePopup` | 位移 367 ms + 淡入 83 ms（**再延迟 83 ms** 才淡入） |
| 淡入 / 淡出 `fadeIn` / `fadeOut` | 250 ms / 167 ms，linear |
| 徽章更新 `updateBadge` | 淡入 367 ms + 位移 **1333 ms**（磁贴徽章那个夸张的长滑入） |
| 列表新增 `createAddToListAnimation` | 新增项 `scale(0.85)→1` 120 ms + 其余项归位 400 ms（延迟 240 ms） |
| 拖拽开始 `dragSourceStart` | 源 `scale(1.05)` + 透明度 0.65，其余项 `scale(0.95)`，240 ms |
| 页面转场 `turnstileForwardIn` | `perspective(600px) rotateY(80deg)→0deg`，300 ms，交错 50 ms |
| 连续体转场 `continuumForwardIn` | `scale(0.5)+rotateX(80deg)` → `scale(1)`，350 ms |
| 钻取转场 `drillInIncoming` / `Outgoing` | 500 ms（`scale(0.84)→1`）/ 233 ms（`1→1.29`） |

完整 61 条见 `official-values.md`。

---

## 用法

```html
<link rel="stylesheet" href="win8-animation-library.css">
<script src="win8-animations.js"></script>
<script>
  var A = Win8Anim;

  A.enterPage(document.querySelector('.page'));        // 页面进场
  A.showPanel(document.getElementById('settings'));    // 设置面板右滑进
  A.pointerDown(tile);                                  // 磁贴按下
  setTimeout(function () { A.pointerUp(tile); }, 200);  // 抬起复位

  // 列表增删：构造 → 改 DOM → execute（官方就是三段式 FLIP）
  var anim = A.createAddToListAnimation([newItem], existingItems);
  list.insertBefore(newItem, list.firstChild);
  anim.execute();

  A.slow = true;      // 官方 _slowAnimations：慢放 ×3，便于审阅曲线
  A.fast = true;      // 官方 _fastAnimations：×1/20，自动化测试用
  A.enabled = false;  // 官方 isAnimationEnabled=false：直接落位，不播动画
</script>
```

演示页的结构（`win8-animation-demo.html`）：

| 位置 | 内容 |
|---|---|
| 顶部工具条 | **转场选择器**（enterPage / turnstile / slide 上下 / slide 横向 / continuum / drillIn）+ 官方三个调试开关 |
| ① 磁贴页 | 17 个磁贴：指针反馈、内容进出、淡入淡出、浮出层、徽章、AppBar、设置面板、转场类、拖拽源、Peek 窥视、两个页面入口 |
| ② 列表页 | 新增 / 展开 / **收起** / **重排** / 删除 + **搜索建议列表**（117ms 新增、93ms 删除） |
| ③ 分批进入转场页 | **独立演示**：进场默认**从右往左滑 + 分批** `enterPage([[标题,副标题],[说明],[内容]], {left:'160px'})` → 0 / 0 / 83 / 166 ms；页内三个按钮重放对比「按批次 + 从右往左滑（默认）」「按批次 + 官方默认偏移（下移 28px）」「逐个区域 + 从右往左滑」 |
| ④ 手势页 | **滑动多选**（swipeReveal → swipeSelect / swipeDeselect）+ **拖拽落点指示**（dragBetweenEnter / dragBetweenLeave） |
| 全局 | AppBar（showEdgeUI/hideEdgeUI）、设置面板（showPanel）、弹出菜单（showPopup/hidePopup） |

需要哪些补充动画，对照 `where-used.md` 里的反查表即可。

想只用 CSS？`win8-animation-library.css` 暴露了官方关键帧（`WinJS-enterPage`、
`WinJS-showPanel`、`WinJS-updateBadge` …）和对应的工具类 `.win-anim-*`，
以及官方的 CSS 变量 `--winjs-ease-standard`。你现有 demo 里手写的
`cubic-bezier(0.1, 0.9, 0.2, 1)` 标注为"官方 Win8 缓动曲线"是对的，
它确实是 WinJS 的主力曲线。

---

## 与"真·Win8"的差异，说明白

1. **版本**：WinJS 在 GitHub 上的仓库最早只到 3.0（Win8.1 时代），Win8 首发自带的
   WinJS 1.0 / 2.0 源码没有单独发标签。我把 3.0.1 与 4.4 的 `Animations.js` 做了逐值对比：
   **时长与曲线集合一致**（4.4 只是新增了拖拽相关条目），所以你拿到的就是 Win8 当年的规格。
2. **启动动画**：Win8 开机那几秒的动画在 `bootres.dll` 的资源里，属于系统文件，
   微软没有提供任何可再分发的动画资产。想要复刻只能照帧重画；
   你目录里的 `win8-start-screen.html` 走的正是"重画"路线，是可行且不侵权的做法。
3. **曲线命名**：官方源码里曲线是内联字符串，没有命名常量。`win8-animations.js` 里的
   `EASE.standard` 等命名只是为了可读性，值本身一字未改。
4. **图标字形**：官方导航/汉堡图标来自 **Segoe MDL2 Assets / Segoe UI Symbol**，macOS 两个都没有。
   用 Unicode 字形回退会得到**三种不同字体**的字形，同一 `font-size` 下墨迹 11.18 / 9.16 / 15.62px，
   大小天然不齐（齿轮会明显偏小）。所以导航图标按官方规格**自绘 SVG**：
   16×16 图标框、12×12 墨迹、1.5px 单线宽，三个图标光栅化后墨迹完全一致（极差 0.000px）；
   汉堡按钮同理用 CSS 三条杠代替 `\E700`。**官方尺寸/颜色/间距全部保留**，只有字形是画的 —— 规则见 `KIT.md` 第 18 条。
5. **复选框的"勾"与"半选横杠"也是自绘的**：官方靠 IE 的 `::-ms-check` 由**系统绘制**
   （勾的颜色取勾选态 `color: #fff`，半选横杠取 `@baseMediumHigh`），Chromium/Safari 根本没有这个伪元素。
   本库用 `appearance: none` 复刻几何与全部状态配色（20×20 / 2px 边框 / 12-8-12 外边距 / 勾选·悬停·按下·禁用四态），
   只有"勾、横杠"这两笔图元是画的 —— 理由同上一条：**绝不再用 Segoe MDL2 私用区字形**
   （缺字体就渲染成豆腐块）。`check_ui_conventions.py` 有一条规则专门拦私用区字形。
6. **侧栏没有偏离项**：左侧导航的数值全部来自 WinJS 源（行高 48、图标框 16×16 且
   `margin-top: 14px`、内距 16、文字 `_win-type-body()` 15px/400 + 13/15 外边距、hover/press 配色、
   1px dotted 焦点框、菜单按钮 48×48），结构与选中态来自 WinUI NavigationView 文档
   （窗格表头行 + PaneTitle、设置入口在窗格底部、选中态左缘指示条、三档断点）。
   原先为"字太小 / 离顶部太近"打的两个补丁（20px 字号、12px 内边距）**都已撤掉** ——
   官方结构本身就给出了顶部节奏（表头行 48px，条目从它之下开始）。
   逐条对照见 `KIT.md` 第 18 条。
7. **首屏入场是"项目约定"、不是官方规定**：`enterPage` 的官方用途是**页面导航**，首屏在 Win8 里由系统闪屏
   （splash screen）交棒，官方没规定首屏要播一次入场动画。本库按用户要求加了这条约定：页面打
   `data-enter-on-load`，打开就播一次官方分批进场 —— **偏移用 `contentOffset(false)`，从右往左滑 100px**
   （与页面转场同一套观感；官方 `enterPage` 的默认偏移本是"下移 28px"，去掉第二个参数即退回），
   其余参数全用官方值：位移 1000ms + 淡入 170ms、交错 `min(83×i, 333)`。
   撤掉只需删掉标记与那次调用，见 `KIT.md` 第 20 条。
8. **焦点虚线框改成"只给键盘"**：官方源码写的是 `:focus`（`styles-toggleswitch.less` 里那圈 1px dotted），
   那时还没有 `:focus-visible`，于是**鼠标点一下开关也会冒虚线框**。本库统一用 `:focus-visible`
   （键盘 Tab 仍有官方那圈虚线框）；顺带补上了复选框/单选的焦点框 —— 它们用 `appearance: none`
   把浏览器原生焦点环去掉了，而官方在 IE 下靠 `::-ms-check` 的原生焦点视觉。
   **下拉框例外**：`<select>` 在 Chrome 里鼠标点击也会命中 `:focus-visible`（实测），虚线框挡不住，
   所以改用强调色边框 + `outline: none`（官方固有控件本来就是"`outline: 0` + 自己画指示"）。
   见 `KIT.md` 第 21 条。

---

## 内置的官方控件

`win8-controls.css` 里的控件全部按 WinJS 源码数值复刻，属性面板里有可运行的例子：

| 控件 | 官方来源 | 关键数值 |
|---|---|---|
| 按钮 / 命令 / 输入框 | `styles-intrinsic.less` + `colors-intrinsic.less` | 2px 边框、方角、hover 只显边框；输入框 focus = **白底黑字 + 强调色边框** |
| **复选框 Checkbox / 单选 Radio** | `styles-intrinsic.less` §Radio and check + `colors-intrinsic.less` | 20×20、边框 2px、`margin 12px 8px 12px 0`（框在前、文字在后）；勾选 = **强调色底 + 白勾**、悬停白边、按下 `@baseMid` |
| **开关 ToggleSwitch** | `styles-toggleswitch.less` + `colors-toggleswitch.less` | 轨道 44×20、滑块 ⌀10、**left 0.1s** 官方过渡 |
| **下拉框** | `styles-intrinsic.less` + `colors-globalIntrinsics.less` | 2px 边框、min-height 32px、方角、hover 变底；选中项 = 强调色底 |
| **进度条** | `styles-intrinsic.less` + `colors-intrinsic.less` | 180×4、官方不确定态关键帧、`.win-paused` 官方缓动；填充 = 强调色 |
| **链接 Link** | `styles-intrinsic.less` §Link | 下划线 + **强调色**文字；hover `@baseMid` |
| **滑块 Slider** | `styles-intrinsic.less`（固有元素 `input[type=range]`） | 280×44、轨道 2px、滑块 8×24 圆角 4px |
| 左侧导航 / 分割视图 | `styles-splitview*.less` + NavigationView 文档 | 320 / 48px、三档自适应 |

强调色由**应用**提供（官方如此）：改 `--win-accent` 一个变量即可 —— 吃强调色的位置官方是逐条列在
`raw/js_WinJS_IntrinsicControls.js`（`src/js/WinJS/Controls/IntrinsicControls.js`）里的：
复选框勾选态底色 / 复选框半选与单选勾选态边框 / 输入框 focus 边框 / 链接文字 / 下拉框选中项底色 /
进度条填充 / 开关 ON 轨道 / 导航选中指示条。

复选框的"勾"和"半选横杠"在官方是 `::-ms-check` 由**系统绘制**的，Chromium/Safari 没有这个伪元素 →
本库自绘：10×10 白色 SVG 勾（颜色取官方勾选态 `color: #fff`）、10×2 横杠（取半选态 `@baseMediumHigh`）。
**不再用 Segoe MDL2 的私用区字形** —— 那套字体不在，缺了就渲染成豆腐块（`check_ui_conventions.py` 有一条规则守着）。

> 提示气泡 `.win-tooltip` 曾经实现过，按用户要求已移除（要加回来：`styles-tooltip.less` +
> `colors-tooltip.less`，出入场用官方 `fadeIn`/`fadeOut`，见 `KIT.md` 规则 19）。

---

## 左侧导航按官方断点自适应

官方 NavigationView（`PaneDisplayMode` 默认 `Auto`）把窗口宽度分成三档，阈值来自它两个属性：
`CompactModeThresholdWidth = 641`（保持官方默认）；`ExpandedModeThresholdWidth` 官方默认为 **1008**，
**本模板调高到 1280** —— 官方文档说明这两个阈值是属性、可改：
*"You can modify these values to customize the adaptive display mode behavior."*

| 窗口宽度 | 官方档位 | 模板行为 |
|---|---|---|
| **≥1280px**（官方默认 1008） | `Left` | 窗格**固定展开**、与内容并排；只隐藏菜单按钮（表头行 PaneTitle 保留）|
| 641–1007px | `LeftCompact` | **48px 图标条**，点开后覆盖内容 |
| ≤640px | `LeftMinimal` | 窗格**整个收起**；内容区顶部 **52px 表头**放菜单按钮 + 当前页标题，点开是**浮层**盖住内容 |

细节：只在**跨过**档位时套默认值（同一档内保留手动开合）、首屏不做动画、
跨界时窗格走官方 `resizeTransition`（展开 350ms / 收起 120ms）；Minimal 档的表头高 52px，
窗格浮层从表头之下开始（所以展开时菜单按钮仍在、可再点一次收起）。
规则、数值出处与坑见 `KIT.md` 第 18 条。

---

## 验证

`selftest.html` 在真实 Chromium 里跑，分两阶段：

- **阶段一 · 参数校验**：调用每个动画方法后立即读取元素上的 WAAPI 动画对象，
  断言 `duration` / `delay` / `easing` 与官方值逐条相等。这条路径不依赖动画是否播完，
  因此不受渲染抖动与标签页节流影响。
- **阶段二 · 末态校验**：等动画完成后检查末态内联样式是否落位、返回的 Promise 是否兑现。

```bash
cd win8-metro-ui
python3 -m http.server 8791     # 然后访问 http://127.0.0.1:8791/selftest.html
```

**本机实测结果（Chromium，2026-09 采集环境）：**

| 项目 | 结果 |
|---|---|
| 阶段一 参数校验（45 条动画 × 时长/延迟/曲线） | **45 / 45 通过** |
| `enterPage` 交错延迟 | 通过，序列恰为 `[0, 83, 166, 249]`，与官方 `min(83×i, 333)` 一致 |
| `createAddToListAnimation` | 通过：新增项 120 ms ×2（延迟 240 ms）+ 受影响项 400 ms（延迟 0） |
| `_slowAnimations` ×3 | 通过：250 ms → 750 ms |
| `_fastAnimations` ×1/20 | 通过：250 ms → 12.5 ms |
| `isAnimationEnabled = false` | 通过：不产生动画对象，直接落位 |
| 阶段二 末态落位 + Promise 兑现 | **45 / 45 通过**（含在被遮挡标签页中的运行） |
| 补充校验（交错延迟、调试开关） | **5 / 5 通过** |
| 合计 | **95 / 95** |

> 自检页里对这一点也写明了：跑阶段二时请让标签页保持在可见的前台。

### 控件与首屏的实测（Chromium 真实渲染，2026-09）

临时探针页（同源 iframe + 真实点击/按键，量 `getBoundingClientRect` / `getComputedStyle` /
WAAPI `effect.getTiming()`）跑 **36 条**断言，全过。关键几条：

| 断言 | 实测 |
|---|---|
| 复选框几何 | 20×20、边框 `2px solid`、框与文字间距 **8.0px**、两者中线对齐、外边距 12/8/12 |
| 勾选态 | 底色 `rgb(96,205,255)`（= `--win-accent`）、边框透明；自绘 SVG 勾在 canvas 里画出 **27 个**不透明像素（不是豆腐块） |
| 取消勾选 → 行内删除按钮 | 官方 `fadeOut` **167ms** ×3 → `display:none`；重新勾选 → `fadeIn` **250ms**；未勾选时新增的行也不显示按钮 |
| 面板进场 | 仍是两批：`delay=[0,0,0,83,83]`（标题 0ms / 其余 83ms） |
| 下拉框排序 | 升序 1,2,3,4 / 降序 4,3,2,1；排序时跑 `createRepositionAnimation` **367ms**、交错 0/33/66/99ms |
| 首屏入场 | 打开模板与演示页页内区域立刻产生动画：`delay=[0,83,166,249]`、位移 1000ms / 淡入 170ms；起手 `translate(100px, 0px)`，实测**从右往左滑 100.0px**（模板 x 456→356、演示页 144→44），1.4s 后落终态 |
| 虚线焦点框 | 真实鼠标点击：开关/复选框 **无**虚线框（修掉的正是"点开关冒虚线框"）；真实 Tab 键：两者出现官方那圈 `1px dotted`。下拉框改用**强调色边框**（`<select>` 在 Chrome 里鼠标点击也命中 `:focus-visible`，虚线框挡不住） |
| 进度条 | 180×4，值随行数走 |
| 演示页工具条 | 52px 高装得下官方控件（无纵向溢出），下拉框 2px / 15px / 自绘箭头都在 |
| 提示气泡 | DOM 与样式表里都没有 `.win-tooltip` |

`check_ui_conventions.py` 除原有的官方数值规则外，现在还守着：复选框/单选用官方类且必须有
可访问名字、不许用私用区字形当图标、**打开页面要播首屏入场**（项目约定）、
**虚线焦点框只在键盘操作时出现**（`:focus-visible`）。

---

## 官方规范：分批进入（staggered entry）

Win8 的页面转场**不是整页一起进**，官方规定要把页面拆成若干"区域"，各区域**分批**上屏：

- **API 契约**（`enterPage` 文档）：`element` 传数组时，**顶层数组的每个元素就是一个批次**，
  内层数组里的元素共享同一批次、一起进场。即
  `enterPage([[header, featureLabel], [contentHost, footer]])` → 前一组 0ms、后一组 83ms；
  想逐个进就传平铺数组 `enterPage([a, b, c, d])` → 0 / 83 / 166 / 249 ms。
- **设计指南**（[Animating page transitions](https://learn.microsoft.com/en-us/previous-versions/windows/apps/jj655417(v=win.10))）：
  "The new page is split into regions, and each region moves onto the screen separately, with staggered
  timings. **You specify how the incoming page is split into regions.**"
  —— 注意后半句：**区域怎么划由应用决定**（所以"标题先到、其余随后"是合法的，见 `KIT.md` 规则 4）。
- **确切数值**（源码 `staggerDelay(0, 83, 1, 333)`）：第 i 批延迟 = `min(83 × i, 333)` ms。
- ⚠ **`data-batch` 打在「要动的可见块」上**：`enterPage(incoming)` 动画的就是你传进去的元素 —— 传**框**，框（含底色）和里面的文字一起进场；传框里的**文字**，就只有文字动、框会瞬间出现。
  纯布局的透明包裹层不用打；只有「内容替换」（`enterContent`）才用「外壳静止 + 动画内容层」那套（`KIT.md` 规则 12）。
- **其他动画的交错量**：turnstile 50ms（上限 1000）、slideUp 淡入 34ms（上限 1000）、reposition 33ms（上限 250）。

### 本库的对应关系（严格按官方分工）

官方把这件事拆成**两处**，本库照搬这个分工：

| 官方位置 | 本库 | 行为 |
|---|---|---|
| `WinJS.UI.Animation.showPanel(element, offset)` | `showPanel(element, offset)` | **只管框架**：550ms 滑入，签名就是两个参数 |
| `SettingsFlyout._animateSlideIn`（控件方法） | `settingsFlyoutSlideIn(element, offset, options)` | **框架 + 内容逐区域进场**：框架 550ms；官方对每个 `div.win-content` **各调一次** `enterPage`（±100px 位移 1000ms + 淡入 170ms），单元素调用批次号为 0 → **区域之间没有交错，同时进场** |

```js
// 官方原样的 showPanel：只滑框架
Win8Anim.showPanel(panel);

// 复刻 SettingsFlyout._animateSlideIn：框架 + 内容逐区域进场（官方无交错）
Win8Anim.settingsFlyoutSlideIn(panel, null, { contentSelector: '.win-content' });
```

`options`：`content`（传**嵌套数组**时才按批次交错 —— 那是调用方明确要的分批；传扁平数组或走选择器则逐区域同时进场）、`contentSelector`（不传 content 时用选择器在面板内收集，
官方用的就是 `query("div.win-content")`）、`contentOffset`（默认 `{top:'0px', left:'100px'}`，RTL 自动取负）。

右侧设置面板的官方实现（`SettingsFlyout._animateSlideIn`）是**两层叠加**：
面板框架 `showPanel` 550ms 滑入，面板内每个 `div.win-content` 各自跑 `enterPage`（±100px 位移 1000ms + 淡入 170ms）。
框架 550ms 就位、内容还在 1000ms 的长位移里滑 —— 这就是"内容比标题晚到位"的手感来源。
注意它那里是**逐个元素单独调用**，每次只有 1 个元素 → 批次号恒为 0 → 那 83ms 交错并未被用上；
要得到明确的分批，必须在一次调用里传嵌套数组。

## 分批进入已扩展到所有转场与边栏

页面内容按 `data-batch` 分组，收集成**嵌套数组**交给官方 `enterPage` —— 顶层即批次（本项目约定
**大标题独占批次 1**，副标题、正文、详情依次顺延），官方交错量
`min(83 × i, 333)` ms 自动生效；方向默认**从右往左滑**（靠 `enterPage` 的 offset 参数给水平偏移
`{left:'100px'}`（**官方 `SettingsFlyout` 的偏移值本身**），官方设计指南则规定
"进场方向取阅读顺序的反向"）。

| 转场模式 | 进场怎么组合 |
|---|---|
| `enterPage` | **分批直接接管**：对页面区域调 `enterPage(批次数组, offset)`（这就是官方的分批进场） |
| `turnstile` / `slide` / `continuum` / `drillIn` | **框架 + 分批内容**两层：页面框架跑该转场的官方动画，页内区域额外按官方 `enterPage` 分批进入 |
| 边栏（设置面板） | `settingsFlyoutSlideIn`：框架 `showPanel` 550ms + 内容 `enterPage`。默认逐区域**同时**进场（= 官方 `SettingsFlyout._animateSlideIn`）；要在面板内**分批**（如「标题先到、其余随后」）就给区域打 `data-batch` 并传嵌套数组，见 `KIT.md` 规则 7 |

**需要说明的边界**：官方库只有 `enterPage`（83ms 上限 333）、`turnstile`（50ms 上限 1000）、
`slideUp` 的淡入（34ms 上限 1000）自带交错；`continuum` / `drillIn` / `slide*` 的官方实现里
`delay` 恒为 0，即**没有**分批概念。所以"所有转场都有分批"是本演示的**组合**（框架 + 分批内容），
用的是官方原语、且与官方 `SettingsFlyout` 的"框架 + 分批内容"两层结构同构 —— 不是官方为这些转场
定义的独立行为，这点在代码注释里也标明了。

### 一个必须处理的坑：出场残留的 `opacity: 0`

官方的出场动画（`exitContent`、以及各转场的 `*Out`）会把**整页 section** 的 opacity 落位成 0。
如果进场只动画页内区域（分批进场就是这样），**section 上那个残留的 `opacity: 0` 没人清**，
结果就是整页不可见 —— 表现为"从分批进入页点回主页会黑屏"。

本演示在 `transitionTo` 里两头都清：入场页开始前 `to.style.opacity = ''` / `transform = ''`，
出场页收尾时同样清掉（此时它已靠 `.back` 移到屏幕外，清掉不会露出来）。
官方应用当年由 PageControl 负责重置页面状态，本库是纯动画层、不碰页面状态，所以这一步必须由调用方做。

## 与官方的对齐原则

整个库按"**官方有的必须有、官方没有的不冒充**"来做，`official-api-coverage.md` 里是逐条对照
（官方 51 个成员 **51/51 已实现，0 缺失**），这份表由 `check_api_coverage.py` 解析官方源码自动生成。
本库额外的东西只有 8 个，全部列在那份文档里，并注明与官方的对应关系。

对齐过程中修正的几处（此前不够官方的地方）：

| 项目 | 官方行为 | 原先的做法 → 现在的做法 |
|---|---|---|
| `showPanel` 签名 | 两个参数，只管框架 | 曾把分批内容折进第三个参数 → **恢复官方签名**，分批移入 `settingsFlyoutSlideIn` |
| `createPageNavigationAnimations` | 枚举只有 `turnstile / slide / enterPage / continuum` | 曾自造 `slideHorizontal` → **删除**；`slide` 只映射官方那对 `slideUp`/`slideDown` |
| 省略 `from` 的过渡 | `fadeOut`/`crossFade`/`dragSource*`/`exitContent` → 从**当前计算值**过渡 | 曾写死起点（如固定 1→0）→ **改为读当前值** |
| `dragSourceStart` / `dragSourceEnd` | transform 与 opacity 是**两条独立过渡** | 曾合并成一条 → **拆成两条**，动画条数与官方一致 |
| `_createUpdateListAnimation` | 官方内部 API（增+删+归位三合一） | 曾缺失 → **补齐**，延迟规则照搬源码（有删除项 +60，有其余项再 +240） |
| 调试开关命名 | `WinJS.UI.isAnimationEnabled`、`WinJS.Utilities._fastAnimations` / `_slowAnimations` | 只有短别名 → **同时提供官方命名** |

### 又一条坑：控件不能跟着内容一起滑

`enterPage` 的内容位移是 **1000ms**、淡入只有 **170ms**，曲线又是极度"快起慢收"的 ——
对 32px 高的按钮来说，前 200ms 就走完九成，**之后它已经全亮，却还要横向漂十几像素长达 800ms**，
看起来就是"生硬/没落定"。偏移越大越明显（所以别自己放大偏移，官方推荐默认 28px，
要水平就用 `SettingsFlyout` 的 100px）。

官方对按钮/箭头一律用 **`fadeIn` / `fadeOut`**：
`NavBar/_Container.js:1258` 的滚动箭头、`SemanticZoom.js:687` 的缩放按钮、`FlipView.js:1209` 的翻页按钮。
所以控件要**移出分批区域**，容器加 `win-controls` 类，由 `transitionTo()` 统一做 `fadeIn`。
浏览器实测（`getAnimations()` 取值）：控件容器 = `250ms/linear` 一条；内容区域 = `1000ms + 170ms` 两条。

## 一个必须知道的健壮性设计：挂钟兜底

浏览器的动画时间轴在**窗口被遮挡、切到后台、全屏时焦点不在本窗口**等情况下会被暂停，此时
`animation.finished` 永不兑现。如果只在动画结束回调里落位末态，元素就会永远停在第一帧——
表现就是**「点了没反应」**：`showPopup` 的浮层一直全透明、`showEdgeUI` 的 AppBar 一直在屏幕外。

官方 WinJS 用 CSS 过渡实现，目标样式是**立刻写上去**的，所以不存在这个问题。本库为补齐这一性质，
在 `whenDone()` 里用挂钟与 `finished` 赛跑：超过 `时长 + 延迟 + 150ms` 就强制落位并取消动画。

> 附带经验：**不要用 `opacity: 0` 隐藏会盖住其他元素的浮层**。透明元素仍然参与命中测试，
> 会把下面元素的点击全部吃掉。演示页的 `#popup` 就踩过这个坑，隐藏时改为同时 `visibility: hidden`。

## 权威参考

- WinJS 源码仓库（MIT）：<https://github.com/winjs/winjs>
- 官方 API 文档 `WinJS.UI.Animation`：<https://learn.microsoft.com/previous-versions/windows/apps/br229780(v=win.10)>
- 微软官方动画设计指南（Windows 7 时代，但"快起慢收、167/250 ms"等原则沿用至今）：<https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/uxguide/vis-animations.md>
- 《The Role of Animation in Windows 8》：<https://learn.microsoft.com/archive/blogs/vertical_industries/the-role-of-animation-in-windows-8>

微软设计指南里几条与上面参数互相印证的原则：

- 动画应在**触发后 50 ms 内开始**，否则会觉得迟钝。
- 常用过渡取 **167 ms（1/6 秒）** 或 **250 ms（1/4 秒）**；更频繁的操作用更快的时间。
- 要"响应快"就得**快起慢收**，不要 overshoot；退场往往用 linear。
- 尊重系统的「关闭不必要的动画」开关 —— 本库用 `A.enabled = false`
  以及 `prefers-reduced-motion: reduce` 两条路径来兑现。
