#!/usr/bin/env python3
"""检查一个页面是否合规地使用了 Win8/Metro KIT（规则见 KIT.md）。

用法：
    python3 check_ui_conventions.py win8-tool-starter.html [更多文件.html ...]

退出码：有 FAIL 时返回 1，便于接入任何流程。
某一行确实需要例外时，在该行加注释 kit-lint-ignore 即可跳过该项检查。
"""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).parent
OFFICIAL_SRC = HERE / "raw" / "js_WinJS_Animations.js"

# 官方 API 名单：直接解析官方源码（MIT），不手抄
official = {
    n for n in re.findall(r"^        (\w+): function \(", OFFICIAL_SRC.read_text(encoding="utf-8"), re.M)
    if n not in ("execute", "getOffset")
}
# 本库允许的扩展（见 official-api-coverage.md）
EXTENSIONS = {
    "settingsFlyoutSlideIn", "resizeTransition", "EASE", "stagger", "enabled",
    "isAnimationEnabled", "fast", "slow", "_fastAnimations", "_slowAnimations", "factor",
}
# 官方控件自带的按钮类（SplitView 的导航项与汉堡按钮就是这两类）
OFFICIAL_BUTTON_CLASSES = ("win-button", "win-command", "win-splitviewcommand-button", "win-splitviewpanetoggle")
ALLOWED = official | EXTENSIONS


VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input",
             "link", "meta", "param", "source", "track", "wbr"}

# 这些开始标签会隐式闭合尚未闭合的 <p>（HTML 允许省略 </p>）
BLOCK_TAGS = {"address", "article", "aside", "blockquote", "div", "dl", "fieldset", "figure",
              "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "main",
              "nav", "ol", "p", "pre", "section", "table", "ul"}


class BatchControlFinder(HTMLParser):
    """找出「分批区域里夹带按钮」的情况。

    内容分批 = 内容滑入（enterPage 位移 1000ms）；控件（按钮）官方用 fadeIn
    （WinJS 的 NavBar 箭头 / SemanticZoom 按钮 / FlipView 翻页按钮都是这么做的），
    混在一起会让按钮"已经全亮却还在慢慢漂"，看起来生硬。
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.in_batch_buttons = []
        self.in_content_buttons = []
        # 应用级浮层被塞进"页面内容层"的记录（内容层是层叠上下文，塞进去就永远压不过表头）
        self.overlays_in_pagecontent = []
        # "有底色、却把 data-batch 只打在里面文字上"的容器（框会瞬间出现，只有文字动）
        self.boxes_with_inner_batches = []

    def _in_batch(self):
        return any(x[1] for x in self.stack)

    def _in_content(self):
        return any(x[2] for x in self.stack)

    def _in_pagecontent(self):
        return any(x[3] for x in self.stack)

    def handle_starttag(self, tag, attrs):
        if tag in BLOCK_TAGS:                       # 隐式闭合未闭合的 <p>
            while self.stack and self.stack[-1][0] == "p":
                self.stack.pop()
        a = dict(attrs)
        cls = a.get("class", "")
        in_batch = self._in_batch() or ("data-batch" in a)
        in_content = self._in_content() or ("win-content" in cls.split())
        in_pagecontent = self._in_pagecontent() or ("win-splitview-content" in cls.split())
        own_batch = "data-batch" in a
        if own_batch:                       # 有元素打了 data-batch → 所有还开着的祖先都"内含分批"
            for frame in self.stack:
                frame[4] = True
        if tag == "button":
            if in_content:
                self.in_content_buttons.append(cls)
            elif in_batch:
                self.in_batch_buttons.append(cls)
        # 应用级浮层（AppBar / 边栏 / 弹出菜单）必须在页面内容层**之外**
        if in_pagecontent and a.get("id") in ("appbar", "panel", "popup"):
            self.overlays_in_pagecontent.append("#" + a["id"])
        if tag not in VOID_TAGS:
            self.stack.append([tag, in_batch, in_content, in_pagecontent, False, cls, own_batch,
                               a.get("style", "")])

    # 这些是"画布/外壳"：页面本身、以及自带官方表层动画的浮层（showPanel / showEdgeUI / showPopup），
    # 它们的底色不属于"内容块"，不参与本项检查
    CANVAS_CLASSES = {"page", "win-splitview", "win-splitview-content", "win-splitview-contentwrapper"}

    def _close_frame(self, frame):
        _tag, _in_batch, _in_content, _in_pc, has_inner, cls, own_batch, inline = frame
        classes = set(cls.split())
        if own_batch or has_inner is False or not has_inner:
            return
        if classes & self.CANVAS_CLASSES or _tag == "section":
            return
        self.boxes_with_inner_batches.append((cls, inline))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                for frame in reversed(self.stack[i:]):
                    self._close_frame(frame)
                del self.stack[i:]
                return


def css_text(html: str) -> str:
    """抽出 <style> 块与 style="..." 属性里的内容，只在这些地方查手写动画数值。"""
    out = []
    for m in re.finditer(r"<style[^>]*>(.*?)</style>", html, re.S):
        out.append(m.group(1))
    for m in re.finditer(r'style="([^"]*)"', html):
        out.append(m.group(1))
    return "\n".join(out)


def strip_ignored_lines(text: str) -> str:
    return "\n".join(l for l in text.split("\n") if "kit-lint-ignore" not in l)


def check(path: Path):
    raw = path.read_text(encoding="utf-8")
    html = strip_ignored_lines(raw)
    css = css_text(html)
    results = []          # (level, 规则, 详情)

    def add(ok, rule, detail=""):
        results.append(("PASS" if ok else "FAIL", rule, detail))

    def warn(ok, rule, detail=""):
        results.append(("PASS" if ok else "WARN", rule, detail))

    # 1. 引入 KIT 的两个文件
    has_js = "win8-animations.js" in html
    has_css = "win8-animation-library.css" in html
    add(has_js, "引入 win8-animations.js", "" if has_js else "缺少 <script src=\"win8-animations.js\">")
    add(has_css, "引入 win8-animation-library.css", "" if has_css else "缺少 <link rel=\"stylesheet\">")

    # 2. 不手写缓动曲线
    bad = re.findall(r"cubic-bezier\([^)]*\)", css)
    add(not bad, "不手写 cubic-bezier", "" if not bad else "出现 " + str(sorted(set(bad))[:3]))

    # 3. 不重定义官方关键帧
    dup = re.findall(r"@keyframes\s+(WinJS-[\w-]+)", css)
    add(not dup, "不重定义官方关键帧", "" if not dup else "重复定义 " + ", ".join(sorted(set(dup))[:3]))

    # 4. 页面容器带 aria-label
    pages = re.findall(r"<section[^>]*\bclass=\"[^\"]*\bpage\b[^\"]*\"[^>]*>", html)
    no_label = [p for p in pages if "aria-label=" not in p]
    add(bool(pages) and not no_label, "每个 .page 都有 aria-label",
        "" if not no_label else "%d 个缺失" % len(no_label))

    # 5. 分批标注
    n_batch = len(re.findall(r'data-batch="', html))
    add(n_batch > 0, "页内区域标注 data-batch", "共 %d 处" % n_batch)

    # 6. 转场入口必须清理出场残留（黑屏防护）
    if "function transitionTo" in html or "transitionTo =" in html:
        ok_clean = "to.style.opacity" in html and "from.style.opacity" in html
        add(ok_clean, "transitionTo 清理残留 opacity",
            "" if ok_clean else "未同时清理 to/from 的 opacity（会黑屏，见 KIT.md 规则 11）")
    else:
        add(False, "使用统一的 transitionTo 入口", "未找到 transitionTo()（KIT.md 规则 6）")

    # 6b. 转场进行中的点击必须排队，不能丢（导航高亮是乐观更新，丢了就会"高亮走了、页面没走"）
    if "function transitionTo" in html:
        drop = re.search(r"if\s*\(\s*busy[^)]*\)\s*\{\s*return", html)
        add(not drop, "转场中点击不丢弃（busy 时排队）",
            "" if not drop
            else "官方 enterPage 有 1000ms：busy 时直接 return 会把点击丢掉，"
                 "留下「高亮与页面不一致」的残局（KIT.md 规则 6）")

    # 6c. 插队必须带"同目标守卫"：连点同一个键不能打断它自己的进场动画
    if "finishPageAnimations" in html:
        guard = re.search(r"id\s*===\s*inFlightTo", html)
        add(bool(guard), "插队带同目标守卫（连点同一个键不打断动画）",
            "" if guard
            else "没有 inFlightTo 守卫：连点同一个键会把没放完的进场动画直接拍成最终态（KIT.md 规则 6）")

    # 6d. 边栏开关必须从 light-dismiss 里排除（两个入口都要）
    if 'data-nav="panel"' in html and "hidePanel" in html:
        excl = re.search(r"closest\(\s*['\"][^'\"]*data-act=\"panel\"[^'\"]*['\"]\s*\)", html)
        both = re.search(r"closest\(\s*['\"][^'\"]*data-(?:act|nav)=\"panel\"[^'\"]*data-(?:nav|act)=\"panel\"", html)
        add(bool(both), "边栏开关已从 light-dismiss 排除（两个入口）",
            "" if both
            else "窗格底部的开关是 [data-nav=\"panel\"]，light-dismiss 只排除 [data-act=\"panel\"] 的话，"
                 "pointerdown 会先关掉、click 又开一遍 = 进场动画反复播放（KIT.md 规则 7）")

    # 7. showEdgeUI/hideEdgeUI 必须带 offset
    calls = re.findall(r"A\.(?:showEdgeUI|hideEdgeUI)\(([^)]*)\)", html)
    no_off = [c for c in calls if "," not in c]
    add(not no_off, "showEdgeUI/hideEdgeUI 传 offset",
        "" if not no_off else "%d 处未传偏移（底部 AppBar 会从屏幕上方掉落）" % len(no_off))

    # 8. 隐藏浮层要退出命中测试（不能只有 opacity:0）
    suspects = []
    for m in re.finditer(r"#(\w[\w-]*)\s*\{([^}]*)\}", css):
        body = m.group(2)
        if re.search(r"opacity:\s*0\b", body) and not re.search(r"visibility\s*:\s*hidden|pointer-events\s*:\s*none", body):
            suspects.append("#" + m.group(1))
    add(not suspects, "隐藏浮层退出命中测试",
        "" if not suspects else "这些选择器只有 opacity:0：" + ", ".join(suspects))

    # 9. 按钮外观必须来自官方 .win-button（别自己写边框/底色）
    buttons = re.findall(r"<button\b[^>]*>", html)
    if buttons:
        if "win8-controls.css" in html:
            bad = [b for b in buttons if not any(c in b for c in OFFICIAL_BUTTON_CLASSES)]
            add(not bad, "按钮使用官方按钮类",
                "" if not bad else "%d 个 <button> 未加 win-button 类（KIT.md 规则 12）" % len(bad))
        else:
            warn(False, "引入 win8-controls.css",
                 "页面有 %d 个按钮但未引入官方控件样式（KIT.md 规则 12）" % len(buttons))

    # 10. 分批区域里不该夹带按钮（控件改走官方 fadeIn）
    finder = BatchControlFinder()
    finder.feed(html)
    add(not finder.in_content_buttons, "win-content 区域不含按钮",
        "" if not finder.in_content_buttons
        else "%d 个按钮在 .win-content 里，会跟着内容滑 1000ms（KIT.md 规则 15）" % len(finder.in_content_buttons))
    warn(not finder.in_batch_buttons, "data-batch 区域不含按钮",
         "" if not finder.in_batch_buttons
         else "%d 个按钮在分批区域里；若是操作控件建议移出并改用 fadeIn（KIT.md 规则 15）" % len(finder.in_batch_buttons))

    # 10b. 应用级浮层不能在页面内容层里（内容层是层叠上下文 → 会被 Minimal 表头盖住）
    add(not finder.overlays_in_pagecontent, "应用级浮层在页面内容层之外",
        "" if not finder.overlays_in_pagecontent
        else "这些浮层被放进了 .win-splitview-content："
             + ", ".join(finder.overlays_in_pagecontent)
             + "（内容层自成层叠上下文，里面的 z-index 再大也压不过表头 → 窄屏下被顶部栏遮挡）")

    # 10c. 有底色的块不能只让里面的文字分批（框会瞬间出现、只有文字动 —— KIT.md 规则 12）
    def has_background(classes, inline=""):
        if re.search(r"background(-color)?\s*:\s*(?!none|transparent)", inline or ""):
            return True                       # 行内 style 写的底色也算
        for cls in classes.split():
            if not cls:
                continue
            for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css_clean_early):
                if ("." + cls) in m.group(1) and re.search(r"background(-color)?\s*:\s*(?!none|transparent)", m.group(2)):
                    return True
        return False

    css_clean_early = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    boxes = sorted({(c, inl) for (c, inl) in finder.boxes_with_inner_batches if has_background(c, inl)})
    add(not boxes, "分批打在可见块上（有底色的框不能只让文字动）",
        "" if not boxes
        else "这些元素有底色，但 data-batch 只打在了它里面的文字上（框会瞬间出现、只有文字动，KIT.md 规则 12）："
             + "; ".join(("." + c.split()[0]) if c.split() else (inl[:24] or "行内样式元素")
                         for c, inl in boxes[:3])
             + " → 把 data-batch 移到框本身（纯布局的透明包裹层不用打）")

    # 11. 排版：标题/段落不得写死 font-size / font-weight（应用官方斜坡类，KIT.md 规则 17）
    css_clean = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    bad_type = []
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css_clean):
        sel, body = m.group(1).strip(), m.group(2)
        if not re.search(r"font-(size|weight)\s*:", body):
            continue
        if re.search(r"(^|[\s,>])(h[1-6]|p)(?=[\s,{:.]|$)", sel):
            bad_type.append(sel.replace("\n", " ")[:44])
    add(not bad_type, "标题/段落不写死字号",
        "" if not bad_type else "改用官方斜坡类：" + "; ".join(bad_type[:3]))

    # 11b. 官方控件（开关 / 滑块）必须用官方类，且不得改动官方关键尺寸
    ranges = re.findall(r"<input[^>]*type=\"range\"[^>]*>", html)
    bad_ranges = [r[:40] for r in ranges if "win-slider" not in r]
    add(not bad_ranges, "滑块用官方 .win-slider",
        "" if not bad_ranges else "官方把滑块当固有元素（input[type=range].win-slider）："
                                 + "; ".join(bad_ranges))
    if "win-toggleswitch-track" in html:
        ok_sw = ("win-toggleswitch-on" in html or "win-toggleswitch-off" in html)
        add(ok_sw, "开关用官方 ToggleSwitch 结构 + 状态类",
            "" if ok_sw else "要有 win-toggleswitch-on/off 根状态类（官方状态就是这几个类名）")
        # 官方 DOM 顺序：values（开/关文字）必须在 clickregion 之内、且在 track **之后**
        # —— 官方那条 margin-left:12px 是给"文字跟在轨道右边"用的；放到轨道前面会变成
        # "文字被缩进 12px、又紧贴轨道"（真实反馈："开关左边的文字提示不自然"）。
        seq = re.findall(r'class="win-toggleswitch-(track|values|thumb|clickregion)',
                         re.sub(r'<[^>]*win-toggleswitch-header[^>]*>[^<]*', '', html))
        ok_seq = ("track" in seq) and ("values" in seq) and seq.index("track") < seq.index("values")
        add(ok_seq, "开关的 values 在轨道之后（官方 DOM 顺序）",
            "" if ok_seq else "官方 DOM：header → clickregion → track → **values**；顺序反了文字提示会不自然")

        tr = re.search(r"\.win-toggleswitch-track\s*\{[^}]*width\s*:\s*([\w.]+)", css)
        add(tr is None or tr.group(1) == "44px", "开关轨道用官方 44×20",
            "" if tr is None or tr.group(1) == "44px" else "页面把它改成了 " + tr.group(1) + "；官方 44×20")
    # 新补的官方控件同样要求用官方类
    sels = re.findall(r"<select\b[^>]*>", html)
    bad_sels = [x[:40] for x in sels if "win-dropdown" not in x]
    add(not bad_sels, "下拉框用官方 .win-dropdown",
        "" if not bad_sels else "官方把下拉框当固有元素（select.win-dropdown）：" + "; ".join(bad_sels))
    progs = re.findall(r"<progress\b[^>]*>", html)
    bad_progs = [x[:40] for x in progs if "win-progress-bar" not in x]
    add(not bad_progs, "进度条用官方 .win-progress-bar",
        "" if not bad_progs else "官方把进度条当固有元素（progress.win-progress-bar）：" + "; ".join(bad_progs))

    sl = re.search(r"\.win-slider\s*\{[^}]*width\s*:\s*([\w.]+)", css)
    add(sl is None or sl.group(1) == "280px", "滑块用官方 280×44",
        "" if sl is None or sl.group(1) == "280px" else "页面把它改成了 " + sl.group(1) + "；官方 280×44")

    # 11c. 复选框/单选必须用官方类，并且必须有可访问名字
    #      （官方把两者当固有元素：input[type=checkbox].win-checkbox / input[type=radio].win-radio；
    #        官方几何用 margin-right 8px 拉开框与文字的距离 → "框在前、文字在后"才是官方写法）
    boxes = re.findall(r"<input\b[^>]*type=\"(?:checkbox|radio)\"[^>]*>", html)
    bad_boxes = [b[:44] for b in boxes if ("win-checkbox" not in b and "win-radio" not in b)]
    add(not bad_boxes, "复选框/单选用官方类",
        "" if not bad_boxes
        else "官方把这两者当固有元素（.win-checkbox / .win-radio）：" + "; ".join(bad_boxes))
    unnamed = []
    for b in boxes:
        if "aria-label" in b or "aria-labelledby" in b:
            continue
        mid = re.search(r'id="([^"]+)"', b)
        has_for = bool(mid) and re.search(r'<label[^>]*for="' + re.escape(mid.group(1)) + '"', html)
        wrapped = re.search(r"<label[^>]*>(?:(?!</label>).)*" + re.escape(b), html, re.S)
        if not (has_for or wrapped):
            unnamed.append(b[:44])
    add(not unnamed, "复选框/单选有可访问名字（label 关联）",
        "" if not unnamed
        else "没有 <label for> / 包裹式 label / aria-label，读屏只会念「复选框」：" + "; ".join(unnamed))

    # 11d. 不许拿 Segoe MDL2 的私用区字形画必备图标：那套字体不在（本机就没有）时渲染成豆腐块。
    #      官方本该由系统绘制的地方（复选框的勾、单选的点、下拉框箭头、汉堡键）都要求自绘替身（KIT.md 规则 19）。
    pua_src = css + "\n" + html
    kit_css = path.parent / "win8-controls.css"
    if kit_css.exists():
        pua_src += "\n" + kit_css.read_text(encoding="utf-8")   # 链接进来的 KIT 样式也要查
    pua = (re.findall(r"content\s*:\s*[\"']\\[eE][0-9a-fA-F]{3}", pua_src)
           + re.findall(r"[\ue000-\uf8ff]", pua_src))
    add(not pua, "不用私用区字形当图标",
        "" if not pua
        else "出现 %d 处 Segoe MDL2 私用区字形：缺该字体时是豆腐块，改成自绘 SVG/几何替身" % len(pua))

    # 12. 只调用官方 API（+ 已登记的扩展）
    used = set(re.findall(r"(?:A|Win8Anim)\.(\w+)\s*\(", html))
    unknown = sorted(n for n in used if n not in ALLOWED)
    add(not unknown, "只调用官方 API", "" if not unknown else "未登记：" + ", ".join(unknown))

    # 12b. 虚线焦点框只给键盘：鼠标点一下不该冒虚线框（KIT.md 规则 21）
    #      官方写的是 :focus（那个年代没有 :focus-visible，鼠标点击也会出框）；
    #      本库统一用 :focus-visible —— 键盘 Tab 仍有官方那圈 1px dotted。
    ring_src = css
    ring_kit = path.parent / "win8-controls.css"
    if ring_kit.exists():
        ring_src += "\n" + ring_kit.read_text(encoding="utf-8")
    ring_clean = re.sub(r"/\*.*?\*/", "", ring_src, flags=re.S)
    bad_ring = []
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", ring_clean):
        sel, body = m.group(1).strip(), m.group(2)
        if not re.search(r"outline[^;:]*:\s*[^;]*dotted", body):
            continue
        if ":focus" in sel and ":focus-visible" not in sel:
            bad_ring.append(sel.replace("\n", " ")[:44])
    add(not bad_ring, "虚线焦点框只在键盘操作时出现（:focus-visible）",
        "" if not bad_ring
        else "这些规则用 :focus 画虚线框 → 鼠标点一下也会冒出框（真实反馈过的毛病）："
             + "; ".join(bad_ring[:3]) + " → 改成 :focus-visible")

    # 12c. 打开页面就播首屏入场（**项目约定**，KIT.md 规则 20）。
    #      官方 enterPage 的用途是"页面导航"，首屏官方交给系统闪屏（splash screen），
    #      所以这条是本 KIT 的约定、不是官方值：页面上打 data-enter-on-load，脚本里紧跟一次官方入场调用。
    #      不想遵守就删掉标记并加 kit-lint-ignore 说明原因。
    html_nc = re.sub(r"<!--.*?-->", "", html, flags=re.S)     # 去掉 HTML 注释再找标记
    boot_mark = re.search(r"<[^>]*\bdata-enter-on-load\b[^>]*>", html_nc)
    boot_call = re.search(r"data-enter-on-load[\s\S]{0,600}?\.(?:enterPage|enterContent|settingsFlyoutSlideIn)\s*\(",
                          html_nc)
    add(bool(boot_mark) and bool(boot_call), "打开页面就播首屏入场（项目约定，KIT 规则 20）",
        "" if boot_mark and boot_call
        else ("页面上没有 data-enter-on-load 标记" if not boot_mark
              else "有标记，但脚本里没有紧跟的入场调用（enterPage / enterContent / settingsFlyoutSlideIn）"
                   " —— 首屏要有入场动画（用官方分批进场参数）"))

    # 12d. 首屏入场的运动方向 = **从右往左**（横向偏移），与页面转场同一套（KIT.md 规则 20）。
    #      官方 enterPage 的默认偏移是"下移 28px"；本项目约定首屏也走横向 —— 所以那次调用要带 offset。
    boot_off = re.search(r"data-enter-on-load[\s\S]{0,600}?"
                         r"\.(?:enterPage|enterContent|settingsFlyoutSlideIn)\([^;]*?(contentOffset|left)",
                         html_nc)
    add(bool(boot_off), "首屏入场带横向偏移（从右往左滑，与转场同一套）",
        "" if boot_off
        else "首屏那次入场没带 offset → 落地就是官方默认的「下移 28px」；"
             "本项目约定要和页面转场一致、从右往左滑：传 contentOffset(false) 或显式 {left: …}")

    # 13. 左侧导航的自适应断点必须用官方值（KIT.md 规则 18）
    #     官方 NavigationView 默认 Auto：≥1008 Left / 641–1007 LeftCompact / ≤640 LeftMinimal
    # 导航类规则只在**真的装了窗格**时校验：原来用 CSS/JS 残留（nav-pinned / NAV_WIDE）
    # 判断，于是"只取内容区、不要左侧导航"这种合理组合会被误判为不合格。
    # 窗格不在页面里，这些规则（断点、LeftMinimal 表头、窗格结构）就无从谈起，直接跳过。
    has_nav_pane = bool(re.search(r"win-splitview-pane(?![\w-])", html))
    if has_nav_pane:
        # 官方默认 1008，但官方文档明确说这两个阈值是属性、可以改 ——
        # 所以：用 1008 直接过；用别的值必须在**同一行**注明这是自定义（写"官方默认"或"自定义"）。
        m = re.search(r"NAV_WIDE\s*=\s*(\d+)([^\n]*)", html)
        ok_wide = bool(m) and (m.group(1) == "1008" or ("官方默认" in m.group(2) or "自定义" in m.group(2)))
        add(ok_wide, "自适应断点：官方 1008 或标注过的自定义值",
            "" if ok_wide
            else "官方默认 ExpandedModeThresholdWidth = 1008 / CompactModeThresholdWidth = 641；"
                 "改这两个阈值是官方允许的，但要**在同一行注明**是自定义（便于回溯）")
        c = re.search(r"NAV_COMPACT\s*=\s*(\d+)", html)
        add(bool(c) and c.group(1) == "641", "自适应第二断点用官方 641px",
            "官方 CompactModeThresholdWidth = 641（≤640 就是 LeftMinimal）"
            if not c or c.group(1) != "641" else "官方 CompactModeThresholdWidth")
        # 固定展开档（官方 Left）窗格与内容**并排**：内容必须让出 320px，而不是把窗格盖在内容上
        side = re.search(r"nav-pinned[^{]*\{[^}]*padding-left\s*:\s*calc\([^)]*320px", css)
        add(bool(side), "固定展开档内容与窗格并排",
            "" if side else "官方 Left 是并排布局：nav-pinned 下内容左侧要让出 320px")
        # 官方 LeftMinimal：内容区顶部一条固定 52px 表头，放菜单按钮 + 当前页标题
        hdr = re.search(r"\.win-navheader\s*\{[^}]*height\s*:\s*52px", css)
        shown = re.search(r"nav-minimal[^{]*win-navheader[^{]*\{[^}]*display\s*:\s*flex", css)
        add(bool(hdr) and bool(shown), "LeftMinimal 表头固定 52px（官方）",
            "" if hdr and shown
            else "官方：Minimal 档的表头 fixed height of 52 px，停靠内容区顶部（KIT.md 规则 18）")

        # 官方侧栏结构：窗格 = 表头行（菜单按钮 + PaneTitle）+ 条目 + 底部设置入口
        has_head = "win-splitview-panehead" in html
        has_foot = "win-splitview-panefooter" in html
        add(has_head and has_foot, "窗格结构 = 表头行 + 底部设置入口（官方）",
            "" if has_head and has_foot
            else "官方 NavigationView：窗格含菜单按钮 + PaneTitle，设置入口排在窗格最后（KIT.md 规则 18）")

        # 导航项标签必须是官方 _win-type-body()：页面不得把它改成别的字号
        override = re.search(r"\.win-splitviewcommand-label\s*\{[^}]*font-size\s*:\s*([\w.]+)", css)
        add(override is None or override.group(1) == "15px", "导航项文字用官方 15px（_win-type-body）",
            "" if override is None or override.group(1) == "15px"
            else "页面把它改成了 " + override.group(1) + "；官方 splitviewcommand 用 _win-type-body() = 15px/400")

        # KIT 自身不变量：内容区必须自成层叠上下文。
        # 页面转场会给页面挂 z-index（transitionTo 用 1/2），而 Minimal 档的内容区表头
        # （含菜单按钮）就在同一个父层里 —— 不隔开的话页面会盖住表头，
        # 表现为"跳到某页后汉堡键消失"（真实踩过的回归）。
        kit_css = (HERE / "win8-controls.css").read_text(encoding="utf-8")
        content_rule = re.search(r"\.win-splitview-content\s*\{([^}]*)\}", kit_css)
        has_ctx = bool(content_rule and re.search(r"z-index\s*:", content_rule.group(1)))
        add(has_ctx, "KIT：内容区自成层叠上下文（页面不盖表头）",
            "" if has_ctx else "win8-controls.css 的 .win-splitview-content 缺 z-index → 转场后表头会被页面盖住")

        # 窗格表头行不能有左右内边距：菜单按钮必须贴窗格左缘（x=0..48），
        # 否则 48px 图标条里三条杠会被推到 x=31..49 裁掉（真实踩过的回归）
        head_rules = re.findall(r"([^{}]*\.win-splitview-panehead[^{}]*)\{([^}]*)\}", css)
        bad_pad = [sel.strip() for sel, body in head_rules
                   if re.search(r"padding(-left|-right)?\s*:\s*(?!0)", body)]
        add(not bad_pad, "窗格表头行不留左右内边距（菜单按钮贴左缘）",
            "" if not bad_pad else "这些规则给表头行加了内边距，48px 图标条里三条杠会被裁掉："
            + "; ".join(bad_pad[:2]))

        # 选中态要落到 aria-current（样式由 win8-controls.css 的左缘指示条负责）
        if "data-nav" in html:
            has_sel = "aria-current" in html and "setAttribute('aria-current'" in html
            add(has_sel, "导航项有选中态（aria-current + 左缘指示条）",
                "" if has_sel else "官方：Selected items draw their selection indicators along their left edge")

    return results


def main(argv):
    files = [Path(a) for a in argv[1:]] or [HERE / "win8-tool-starter.html"]
    total_fail = 0
    for f in files:
        if not f.exists():
            print("跳过（不存在）：%s" % f)
            continue
        print("\n=== %s ===" % f.name)
        fails = 0
        warns = 0
        for level, rule, detail in check(f):
            mark = {"PASS": "✓", "FAIL": "✗", "WARN": "!"}[level]
            print("  %s %-34s %s" % (mark, rule, detail))
            if level == "FAIL":
                fails += 1
            elif level == "WARN":
                warns += 1
        tail = "全部通过" if not fails else "%d 项未通过" % fails
        if warns:
            tail += "（另有 %d 条建议）" % warns
        print("  --> %s" % tail)
        total_fail += fails
    print("\n合计未通过：%d" % total_fail)
    return 1 if total_fail else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
