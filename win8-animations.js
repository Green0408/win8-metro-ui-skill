/*!
 * win8-animations.js — Windows 8 / WinJS 动画库的忠实移植版
 *
 * 所有时长、延迟与缓动曲线均逐字取自微软 MIT 许可的 WinJS 源码
 *   src/js/WinJS/Animations.js        (命名空间 WinJS.UI.Animation)
 *   src/js/WinJS/Animations/_TransitionAnimation.js
 *   src/less/animation-library.less   (关键帧定义)
 *
 * 官方调试开关（对应 WinJS.Utilities 同名属性）：
 *   Win8Anim.fast = true   → 时长 ×1/20  (官方 _fastAnimations，自动化测试用)
 *   Win8Anim.slow = true   → 时长 ×3     (官方 _slowAnimations，慢放审阅用)
 *   Win8Anim.enabled = false → 跳过动画直接落位（对应 WinJS.UI.isAnimationEnabled）
 * 另外尊重系统「减少动态效果」：prefers-reduced-motion: reduce 时同样直接落位。
 */
(function (global) {
    'use strict';

    /* ── 官方缓动曲线（原样摘自 Animations.js）──────────────────────────── */
    var EASE = {
        standard: 'cubic-bezier(0.1, 0.9, 0.2, 1)',              // 主力曲线，出现频率最高
        slideIn: 'cubic-bezier(0.17,0.79,0.215,1.0025)',         // slideUp / slideRightIn / slideLeftIn
        slideOut: 'cubic-bezier(0.3825,0.0025,0.8775,-0.1075)',  // slideDown / slideRightOut / slideLeftOut
        turnstileIn: 'cubic-bezier(0.01,0.975,0.4775,0.9775)',   // turnstile *In
        turnstileOut: 'cubic-bezier(0.4925,0.01,0.7675,-0.01)',  // turnstile *Out
        fadeIn: 'cubic-bezier(0, 2, 0, 2)',                      // 进场淡入（带过冲）
        fadeOut: 'cubic-bezier(1,-0.42,0.995,-0.425)',           // 退场淡出
        continuumIn: 'cubic-bezier(0.33, 0.18, 0.11, 1)',
        continuumLift: 'cubic-bezier(0.24,1.15,0.11,1.1575)',
        continuumTilt: 'cubic-bezier(0,0.62,0.8225,0.9625)',
        continuumBackIn: 'cubic-bezier(0.2975, 0.7325, 0.4725, 0.99)',
        deleteItem: 'cubic-bezier(0.11, 0.5, 0.24, .96)',        // 列表项缩小时使用
        linear: 'linear'
    };

    /* ── 状态 ───────────────────────────────────────────────────────────── */
    var factor = 1;        // 官方 _animationFactor，默认 1
    var enabled = true;    // 官方 isAnimationEnabled

    function prefersReduced() {
        return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function ms(v) { return Math.round(v * factor); }
    function off() { return !enabled || prefersReduced(); }

    /* ── 基础工具 ───────────────────────────────────────────────────────── */
    function toArray(x) {
        if (x == null) { return []; }
        return (typeof x.length === 'number' && typeof x !== 'string') ? Array.prototype.slice.call(x) : [x];
    }

    // 官方 applyAction 的数组语义：顶层数组的元素就是"批次"；
    // 若某个元素本身又是个数组，则该数组内的元素共享同一个批次号（延迟相同、一起进场）。
    // 例：enterPage([[header, featureLabel], [contentHost, footer]])
    //     → header/featureLabel 延迟 0，contentHost/footer 延迟 min(83×1, 333) = 83ms
    function batchItems(x) {
        var out = [];
        toArray(x).forEach(function (item, i) {
            if (Array.isArray(item)) {
                item.forEach(function (node) { out.push({ node: node, index: i }); });
            } else {
                out.push({ node: item, index: i });
            }
        });
        return out.filter(function (it) { return it.node; });
    }

    // 完全摊平一到两层（用于位置快照、FLIP 等不需要批次号的场景）
    function flat(x) {
        var out = [];
        toArray(x).forEach(function (item) {
            if (Array.isArray(item)) { out = out.concat(item); } else { out.push(item); }
        });
        return out.filter(Boolean);
    }

    // 官方 staggerDelay(initialDelay, extraDelay, delayFactor, delayCap)
    function stagger(initial, extra, delayFactor, cap) {
        return function (i) {
            var ret = initial, e = extra;
            for (var j = 0; j < i; j++) { e *= delayFactor; ret += e; }
            return cap ? Math.min(ret, cap) : ret;
        };
    }

    function offsetToTransform(off) {
        if (!off) { return 'none'; }
        if (typeof off === 'string') { return off; }
        var top = off.top === undefined ? '0px' : off.top;
        var left = off.left === undefined ? '0px' : off.left;
        return 'translate(' + left + ', ' + top + ')';
    }

    // 收集面板内需要分批进入的内容区域。
    // 传了 content 就原样返回（保留嵌套数组的批次结构）；否则按 contentSelector 在面板内查找。
    function resolvePanelContent(element, options) {
        if (options.content) { return options.content; }
        if (options.contentSelector) {
            var panel = flat(element)[0];
            return panel ? Array.prototype.slice.call(panel.querySelectorAll(options.contentSelector)) : [];
        }
        return [];
    }

    // 取元素当前的计算不透明度：官方用 CSS 过渡实现的那几条动画省略了 from，
    // 语义就是"从当前值过渡到目标值"，这里如实还原。
    function currentOpacity(element) {
        var node = toArray(element)[0];
        if (!node) { return 1; }
        var v = parseFloat(global.getComputedStyle(node).opacity);
        return isNaN(v) ? 1 : v;
    }

    // 取元素当前的计算 transform（无则返回单位矩阵），用于起点插值
    function currentTransform(element) {
        var node = toArray(element)[0];
        if (!node) { return 'none'; }
        var t = global.getComputedStyle(node).transform;
        return (!t || t === 'none') ? 'scale(1, 1)' : t;
    }

    function commit(node, frame) {
        if (!frame) { return; }
        for (var k in frame) {
            if (Object.prototype.hasOwnProperty.call(frame, k)) {
                node.style[k] = frame[k];
            }
        }
    }

    // 等待动画结束，但绝不无限等待：
    // 浏览器在窗口被遮挡 / 切到后台 / 全屏时焦点不在本窗口等情况下会暂停动画时间轴，
    // 此时 animation.finished 永不兑现。若只依赖它，元素会永远停在第一帧
    // （典型症状：showPopup 的浮层一直透明、showEdgeUI 的 AppBar 一直在屏幕外 —— 看起来就是"没反应"）。
    // 官方 WinJS 用 CSS 过渡实现，目标样式是立刻写上去的，不存在这个问题；这里用挂钟兜底补齐该性质。
    function whenDone(animation, duration, delay) {
        var finished = (animation.finished && animation.finished.then)
            ? animation.finished.catch(function () { /* 被 cancel 时静默 */ })
            : null;
        var watchdog = new Promise(function (resolve) {
            global.setTimeout(resolve, duration + delay + 150);
        });
        return finished ? Promise.race([finished, watchdog]) : watchdog;
    }

    /**
     * 运行一段动画。spec = { frames, duration, delay, easing }
     * duration / delay 可以是数字，也可以是 (index) => number 的函数（交错延迟）。
     * 结束后把末帧内联样式写回元素，与 WinJS 的可视终态一致。
     */
    function run(node, spec) {
        var items = batchItems(node);
        if (!items.length) { return Promise.resolve(); }
        var end = spec.frames[spec.frames.length - 1];

        return Promise.all(items.map(function (item) {
            var node = item.node;
            var i = item.index;          // 批次号（官方语义）
            var d = ms(typeof spec.duration === 'function' ? spec.duration(i) : spec.duration);
            var dl = ms(typeof spec.delay === 'function' ? spec.delay(i) : (spec.delay || 0));

            if (off() || d === 0) { commit(node, end); return Promise.resolve(); }

            var animation = node.animate(spec.frames, {
                duration: d,
                delay: dl,
                easing: spec.easing || EASE.standard,
                fill: 'both'
            });
            return whenDone(animation, d, dl).then(function () {
                commit(node, end);          // 无条件落位，保证终态正确
                try { animation.cancel(); } catch (e) { /* 已结束的动画 cancel 无副作用 */ }
            });
        }));
    }

    function join(a, b) { return Promise.all([a, b]).then(function () { }); }

    /* ── FLIP 辅助：记录位置 → 改 DOM → 从旧位置滑回来 ───────────────────── */
    function snapshot(nodes) {
        return flat(nodes).map(function (n) { return n.getBoundingClientRect(); });
    }

    function flipFrames(before, node, suffix) {
        var after = node.getBoundingClientRect();
        var dx = Math.round(before.left - after.left);
        var dy = Math.round(before.top - after.top);
        var from = 'translate(' + dx + 'px, ' + dy + 'px)' + (suffix ? ' ' + suffix : '');
        return [{ transform: from }, { transform: 'none' }];
    }

    function flip(nodes, before, duration, delay) {
        return Promise.all(flat(nodes).map(function (node, i) {
            return run(node, {
                frames: flipFrames(before[i], node),
                duration: duration,
                delay: typeof delay === 'function' ? delay(i) : delay,
                easing: EASE.standard
            });
        }));
    }

    /* ── 动画库 ─────────────────────────────────────────────────────────── */
    var API = {

        /* 官方曲线常量，方便直接复用 */
        EASE: EASE,
        stagger: stagger,

        /* ── 淡入淡出 ──────────────────────────────────────────────────── */
        // 官方 fadeIn: opacity 0→1, 250ms linear
        fadeIn: function (shown) {
            return run(shown, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 250, easing: EASE.linear });
        },
        // 官方 fadeOut: opacity →0, 167ms linear
        fadeOut: function (hidden) {
            return run(hidden, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 167, easing: EASE.linear });
        },
        // 官方 crossFade: 进出各 167ms linear
        crossFade: function (incoming, outgoing) {
            return join(
                run(incoming, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 167, easing: EASE.linear }),
                run(outgoing, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 167, easing: EASE.linear })
            );
        },

        /* ── 指针反馈（磁贴按下的那 0.975 缩放）────────────────────────── */
        // 官方 pointerDown: transform → scale(0.975, 0.975), 167ms standard
        pointerDown: function (element) {
            return run(element, {
                frames: [{ transform: currentTransform(element) }, { transform: 'scale(0.975, 0.975)' }],
                duration: 167
            });
        },
        // 官方 pointerUp: transform → "" ，167ms standard（复位）
        pointerUp: function (element) {
            return run(element, {
                frames: [{ transform: currentTransform(element) }, { transform: '' }],
                duration: 167
            });
        },

        /* ── 边缘 UI（AppBar、超级按钮）────────────────────────────────── */
        // 官方 showEdgeUI: 默认从 translateY(-70px) 归位, 367ms standard
        showEdgeUI: function (element, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateY(-70px)';
            return run(element, { frames: [{ transform: from }, { transform: 'none' }], duration: 367 });
        },
        hideEdgeUI: function (element, offset) {
            var to = offset ? offsetToTransform(offset) : 'translateY(-70px)';
            return run(element, { frames: [{ transform: 'none' }, { transform: to }], duration: 367 });
        },
        // 官方 showPanel(element, offset)：面板**框架**从边缘滑入，550ms standard
        // 默认水平 364px（右侧设置面板宽度）。官方签名就是两个参数，这里保持一致。
        showPanel: function (element, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateX(364px)';
            return run(element, { frames: [{ transform: from }, { transform: 'none' }], duration: 550 });
        },
        // 复刻官方 SettingsFlyout._animateSlideIn：**框架 + 分批内容**两层一起做。
        // 官方源码（SettingsFlyout.js）：
        //   var offset = animateFromLeft ? "-100px" : "100px";
        //   _ElementListUtilities.query("div.win-content", this._element)
        //       .forEach(function (e) { Animations.enterPage(e, { left: offset }); });
        //   ...
        //   return Animations.showPanel(this._element, where);
        // 因此时间线是：框架 550ms 到位；每个内容区域各自跑 enterPage（±100px 位移 1000ms + 淡入 170ms），
        // 区域之间按官方 enterPage 的批次交错 83ms 依次进场（官方控件是逐区域单独调用，故未用到那 83ms）。
        // options.content / options.contentSelector / options.contentOffset 见 resolvePanelContent。
        settingsFlyoutSlideIn: function (element, offset, options) {
            options = options || {};
            var slide = API.showPanel(element, offset);

            var content = resolvePanelContent(element, options);
            if (!content.length) { return slide; }

            var panel = flat(element)[0];
            var rtl = !!(panel && global.getComputedStyle(panel).direction === 'rtl');
            var from = options.contentOffset || { top: '0px', left: rtl ? '-100px' : '100px' };

            /* 官方 SettingsFlyout._animateSlideIn 是**逐区域**调用：
                   _ElementListUtilities.query("div.win-content", this._element)
                       .forEach(function (e) { Animations.enterPage(e, { left: offset }); });
               传单个元素时批次号 = 0 → 延迟 0 → **所有区域同时进场，区域之间没有交错**。
               所以这里也逐区域调用。早先的实现是把列表一次性交给 enterPage，批次号会变成
               0/1/2 → 83ms/166ms 交错，与官方不一致（已修正）。
               要**自定义分批**（例如"文字先到、控件随后"）：用 options.content 传**嵌套数组**，
               那种情况仍按官方 enterPage 的批次语义交错 —— 那是调用方明确要求的，不是默认行为。 */
            var explicitBatches = Array.isArray(options.content) &&
                options.content.some(function (x) { return Array.isArray(x); });
            if (explicitBatches) { return join(slide, API.enterPage(content, from)); }

            // 逐区域调用：每个区域各自 delay 0（= 同时进场，官方行为）
            return join(slide, join.apply(null, content.map(function (e) {
                return API.enterPage(e, from);
            })));
        },
        hidePanel: function (element, offset) {
            var to = offset ? offsetToTransform(offset) : 'translateX(364px)';
            return run(element, { frames: [{ transform: 'none' }, { transform: to }], duration: 550 });
        },
        // 官方 showPopup: 位移 367ms standard + 淡入 83ms linear（再延迟 83ms）
        showPopup: function (element, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateY(50px)';
            return join(
                run(element, { frames: [{ transform: from }, { transform: 'none' }], duration: 367 }),
                run(element, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 83, delay: 83, easing: EASE.linear })
            );
        },
        // 官方 hidePopup: opacity →0, 83ms linear
        hidePopup: function (element) {
            return run(element, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 83, easing: EASE.linear });
        },

        /* ── 页面与内容切换 ────────────────────────────────────────────── */
        // 官方 enterPage: 位移 1000ms standard + 淡入 170ms，交错延迟 min(83×i, 333)
        enterPage: function (element, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateY(28px)';
            var d = stagger(0, 83, 1, 333);
            return join(
                run(element, { frames: [{ transform: from }, { transform: 'none' }], duration: 1000, delay: d }),
                run(element, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 170, delay: d })
            );
        },
        // 官方 exitPage: 位移 117ms linear + 淡出 117ms linear
        exitPage: function (element, offset) {
            var to = offset ? offsetToTransform(offset) : 'none';
            return join(
                run(element, { frames: [{ transform: 'none' }, { transform: to }], duration: 117, easing: EASE.linear }),
                run(element, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 117, easing: EASE.linear })
            );
        },
        // 官方 enterContent: 位移 550ms standard + 淡入 170ms standard
        enterContent: function (incoming, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateY(28px)';
            return join(
                run(incoming, { frames: [{ transform: from }, { transform: 'none' }], duration: 550 }),
                run(incoming, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 170 })
            );
        },
        // 官方 exitContent: 位移 117ms linear + 淡出 117ms linear
        exitContent: function (outgoing, offset) {
            var to = offset ? offsetToTransform(offset) : 'none';
            return join(
                run(outgoing, { frames: [{ transform: 'none' }, { transform: to }], duration: 117, easing: EASE.linear }),
                run(outgoing, { frames: [{ opacity: currentOpacity(outgoing) }, { opacity: 0 }], duration: 117, easing: EASE.linear })
            );
        },

        /* ── 列表增删（官方 FLIP 组合动画）────────────────────────────── */
        // 官方 createExpandAnimation：揭示项 167ms 淡入（受影响项存在时延迟 200ms）+ 受影响项 367ms 归位
        createExpandAnimation: function (revealed, affected) {
            revealed = toArray(revealed); affected = toArray(affected);
            var before = snapshot(affected);
            return {
                execute: function () {
                    return join(
                        run(revealed, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 167, delay: affected.length ? 200 : 0 }),
                        flip(affected, before, 367, 0)
                    );
                }
            };
        },
        // 官方 createCollapseAnimation：167ms 淡出 + 367ms 归位（隐藏项存在时延迟 167ms）
        createCollapseAnimation: function (hidden, affected) {
            hidden = toArray(hidden); affected = toArray(affected);
            var before = snapshot(affected);
            return {
                execute: function () {
                    return join(
                        run(hidden, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 167 }),
                        flip(affected, before, 367, hidden.length ? 167 : 0)
                    );
                }
            };
        },
        // 官方 createRepositionAnimation：367ms，交错延迟 min(33×i, 250)
        createRepositionAnimation: function (affected) {
            affected = toArray(affected);
            var before = snapshot(affected);
            return { execute: function () { return flip(affected, before, 367, stagger(0, 33, 1, 250)); } };
        },
        // 官方 createAddToListAnimation：新增项 scale(0.85)→1 120ms + 淡入 120ms linear，受影响项 400ms
        createAddToListAnimation: function (added, affected) {
            added = toArray(added); affected = toArray(affected);
            var before = snapshot(affected);
            var delay = affected.length ? 240 : 0;
            return {
                execute: function () {
                    return join(
                        run(added, {
                            frames: [{ transform: 'scale(0.85)' }, { transform: 'none' }],
                            duration: 120, delay: delay
                        }),
                        run(added, {
                            frames: [{ opacity: 0 }, { opacity: 1 }],
                            duration: 120, delay: delay, easing: EASE.linear
                        }),
                        flip(affected, before, 400, 0)
                    );
                }
            };
        },
        // 官方 createDeleteFromListAnimation：删除项 1→scale(0.85) 120ms + 淡出 120ms linear，剩余项 400ms（延迟 60ms）
        createDeleteFromListAnimation: function (deleted, remaining) {
            deleted = toArray(deleted); remaining = toArray(remaining);
            var before = snapshot(remaining);
            return {
                execute: function () {
                    return join(
                        run(deleted, {
                            frames: [{ transform: 'none' }, { transform: 'scale(0.85)' }],
                            duration: 120, easing: EASE.deleteItem
                        }),
                        run(deleted, {
                            frames: [{ opacity: 1 }, { opacity: 0 }],
                            duration: 120, easing: EASE.linear
                        }),
                        flip(remaining, before, 400, deleted.length ? 60 : 0)
                    );
                }
            };
        },

        // 官方 _createUpdateListAnimation(added, deleted, affected)：一次搞定"新增 + 删除 + 其余项归位"。
        // 官方签名顺序就是 (added, deleted, affected)；前缀下划线表示内部 API（ListView 用它）。
        // 官方延迟规则（源码逐条照搬）：
        //   delay = 0；有删除项 → +60；其余项归位用这个 delay；
        //   有其余项 → +240，否则若 delay 非 0 → +60；新增项用这个 delay。
        _createUpdateListAnimation: function (added, deleted, affected) {
            added = toArray(added); deleted = toArray(deleted); affected = toArray(affected);
            var deletedBefore = snapshot(deleted);
            var affectedBefore = snapshot(affected);

            var delay = deleted.length > 0 ? 60 : 0;
            var addDelay = delay + (affected.length > 0 ? 240 : (delay ? 60 : 0));

            return {
                execute: function () {
                    var tasks = [];

                    // 删除项：先落到自己的相对位置（官方会做这段位移换算），再缩到 0.85 + 淡出
                    deleted.forEach(function (node, i) {
                        var after = node.getBoundingClientRect();
                        var dx = Math.round(deletedBefore[i].left - after.left);
                        var dy = Math.round(deletedBefore[i].top - after.top);
                        var at = 'translate(' + dx + 'px, ' + dy + 'px)';
                        tasks.push(join(
                            run(node, { frames: [{ transform: at }, { transform: at + ' scale(0.85)' }], duration: 120, easing: EASE.deleteItem }),
                            run(node, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 120, easing: EASE.linear })
                        ));
                    });

                    // 其余项归位 400ms
                    tasks.push(flip(affected, affectedBefore, 400, delay));

                    // 新增项：scale(0.85)→1 + 淡入，各 120ms
                    tasks.push(run(added, { frames: [{ transform: 'scale(0.85)' }, { transform: 'none' }], duration: 120, delay: addDelay }));
                    tasks.push(run(added, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 120, delay: addDelay, easing: EASE.linear }));

                    return Promise.all(tasks).then(function () { });
                }
            };
        },

        /* ── 磁贴徽章 ──────────────────────────────────────────────────── */
        // 官方 updateBadge: 淡入 367ms standard + 位移 1333ms standard（默认从 translateY(24px)）
        updateBadge: function (incoming, offset) {
            var from = offset ? offsetToTransform(offset) : 'translateY(24px)';
            return join(
                run(incoming, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 367 }),
                run(incoming, { frames: [{ transform: from }, { transform: 'none' }], duration: 1333 })
            );
        },

        /* ── 页面转场：滑动 / 转门 / 连续体 / 钻取 ─────────────────────── */
        // 官方 slideUp: translate(0,200px)→0, 350ms slideIn；淡入 350ms、交错延迟 min(34×i,1000)
        slideUp: function (incoming) {
            return join(
                run(incoming, { frames: [{ transform: 'translate(0px, 200px)' }, { transform: 'none' }], duration: 350, easing: EASE.slideIn }),
                run(incoming, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 350, delay: stagger(0, 34, 1, 1000), easing: EASE.fadeIn })
            );
        },
        // 官方 slideDown: 0→translate(0,200px), 250ms slideOut；淡出 250ms
        slideDown: function (outgoing) {
            return join(
                run(outgoing, { frames: [{ transform: 'none' }, { transform: 'translate(0px, 200px)' }], duration: 250, easing: EASE.slideOut }),
                run(outgoing, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 250, easing: EASE.fadeOut })
            );
        },
        // 官方 slideRightIn / slideLeftIn：整页 ±视口宽 → 0，350ms slideIn，元素按 200px 递增错位
        slideRightIn: function (page, elements) { return slideStaggered(page, elements, 'in', 1); },
        slideLeftIn: function (page, elements) { return slideStaggered(page, elements, 'in', -1); },
        // 官方 slideRightOut / slideLeftOut：0 → ±视口宽，350ms slideOut
        slideRightOut: function (page, elements) { return slideStaggered(page, elements, 'out', 1); },
        slideLeftOut: function (page, elements) { return slideStaggered(page, elements, 'out', -1); },

        // 官方 turnstileForwardIn: perspective(600px) rotateY(80deg)→0deg, 300ms，交错延迟 min(50×i,1000)
        turnstileForwardIn: function (elements) { return turnstile(elements, 'in', 80, 600); },
        // 官方 turnstileBackwardIn: rotateY(-50deg)→0deg
        turnstileBackwardIn: function (elements) { return turnstile(elements, 'in', -50, 600); },
        // 官方 turnstileForwardOut: 0→rotateY(-50deg), 128ms
        turnstileForwardOut: function (elements) { return turnstile(elements, 'out', -50, 600); },
        // 官方 turnstileBackwardOut: 0→rotateY(80deg), 128ms，perspective(800px)
        turnstileBackwardOut: function (elements) { return turnstile(elements, 'out', 80, 800); },

        // 官方 continuumForwardIn: 缩放 0.5→1 350ms / 上移 225px→0 350ms / rotateX(80deg) scale(1.5)→0deg scale(1)
        continuumForwardIn: function (elements) {
            return run(elements, {
                frames: [{ transform: 'rotateX(80deg) scale(0.5, 0.5)', opacity: 0 }, { transform: 'rotateX(0deg) scale(1, 1)', opacity: 1 }],
                duration: 350, easing: EASE.continuumIn
            });
        },
        // 官方 continuumForwardOut: 1→1.1 缩放 120ms + 8 行 rotateX 152ms
        continuumForwardOut: function (elements) {
            return join(
                run(elements, { frames: [{ transform: 'scale(1, 1)', opacity: 1 }, { transform: 'scale(1.1, 1.1)', opacity: 0 }], duration: 120, easing: EASE.slideOut }),
                run(elements, { frames: [{ transform: 'rotateX(0deg) scale(1, 1) translate(0px, 0px)' }, { transform: 'rotateX(80deg) scale(1.5, 1.5) translate(0px, 150px)' }], duration: 152, easing: EASE.slideOut })
            );
        },
        // 官方 continuumBackwardIn: scale(1.25)→1 200ms + rotateX(80deg) translateY(-100px)→0 250ms
        continuumBackwardIn: function (elements) {
            return join(
                run(elements, { frames: [{ transform: 'scale(1.25, 1.25)', opacity: 0 }, { transform: 'scale(1, 1)', opacity: 1 }], duration: 200, easing: EASE.continuumIn }),
                run(elements, { frames: [{ transform: 'rotateX(80deg) translate(0px, -100px)' }, { transform: 'rotateX(0deg) translate(0px, 0px)' }], duration: 250, easing: EASE.continuumBackIn })
            );
        },
        // 官方 continuumBackwardOut: scale(1)→0.5, 167ms
        continuumBackwardOut: function (elements) {
            return run(elements, { frames: [{ transform: 'scale(1, 1)', opacity: 1 }, { transform: 'scale(0.5, 0.5)', opacity: 0 }], duration: 167, easing: EASE.slideOut });
        },

        // 官方 drillInIncoming: scale(0.84)→1 + 淡入，500ms standard
        drillInIncoming: function (elements) {
            return run(elements, { frames: [{ transform: 'scale(0.84)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], duration: 500 });
        },
        // 官方 drillInOutgoing: scale(1)→1.29 + 淡出，233ms standard
        drillInOutgoing: function (elements) {
            return run(elements, { frames: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.29)', opacity: 0 }], duration: 233 });
        },
        // 官方 drillOutIncoming: scale(1.29)→1 + 淡入，500ms standard
        drillOutIncoming: function (elements) {
            return run(elements, { frames: [{ transform: 'scale(1.29)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], duration: 500 });
        },
        // 官方 drillOutOutgoing: scale(1)→0.84 + 淡出，233ms standard
        drillOutOutgoing: function (elements) {
            return run(elements, { frames: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.84)', opacity: 0 }], duration: 233 });
        },

        /* ── 拖拽（磁贴重排）──────────────────────────────────────────── */
        // 官方 dragSourceStart: 源 scale(1.05) + opacity 0.65，其余项 scale(0.95)，均 240ms standard
        dragSourceStart: function (dragSource, affected) {
            // 官方是两条独立过渡（transform 240ms + opacity 240ms），都从当前值起步
            return join(
                run(dragSource, { frames: [{ transform: currentTransform(dragSource) }, { transform: 'scale(1.05)' }], duration: 240 }),
                run(dragSource, { frames: [{ opacity: currentOpacity(dragSource) }, { opacity: 0.65 }], duration: 240 }),
                run(affected, { frames: [{ transform: currentTransform(affected) }, { transform: 'scale(0.95)' }], duration: 240 })
            );
        },
        // 官方 dragSourceEnd: 源 scale 归零 + opacity 1，500ms standard
        dragSourceEnd: function (dragSource) {
            // 官方：transform → ""（去掉缩放）+ opacity → 1，两条 500ms，均从当前值起步
            return join(
                run(dragSource, { frames: [{ transform: currentTransform(dragSource) }, { transform: '' }], duration: 500 }),
                run(dragSource, { frames: [{ opacity: currentOpacity(dragSource) }, { opacity: 1 }], duration: 500 })
            );
        },

        /* ── 尺寸变化错觉动画（官方 SplitView 用它开合左侧导航）──────────────
           官方位置：WinJS.Utilities._resizeTransition（不在 Animation 命名空间里，故属扩展）。
           原理：CSS 无法动画 width/height，于是同时动画两个元素 —— 外层 clipper 向一侧平移、
           内层元素反向平移，透过 clipper 的 overflow:hidden 看上去就像宽度在变。
           官方默认时长：放大 350ms、缩小 120ms，曲线均为 cubic-bezier(0.1,0.9,0.2,1)。
           args: { from, to, actualSize, dimension:'width'|'height', anchorTrailingEdge, duration?, timing? } */
        resizeTransition: function (elementClipper, element, args) {
            if (!args || args.to === args.from) { return Promise.resolve(); }

            var grow = args.to > args.from;
            var duration = args.duration === undefined ? (grow ? 350 : 120) : args.duration;
            var timing = args.timing || EASE.standard;

            var start = args.actualSize - args.from;
            var end = args.actualSize - args.to;
            if (!args.anchorTrailingEdge) { start = -start; end = -end; }

            var axis = args.dimension === 'height' ? 'translateY' : 'translateX';
            // 两条动画在同一次任务里创建，保证同步起始（官方注释正强调这一点）
            return join(
                run(elementClipper, {
                    frames: [{ transform: axis + '(' + start + 'px)' }, { transform: axis + '(' + end + 'px)' }],
                    duration: duration, easing: timing
                }),
                run(element, {
                    frames: [{ transform: axis + '(' + (-start) + 'px)' }, { transform: axis + '(' + (-end) + 'px)' }],
                    duration: duration, easing: timing
                })
            );
        },

        /* ── 拖拽落点指示 ─────────────────────────────────────────────── */
        // 官方 dragBetweenEnter：让目标让出位置 —— scale(0.95) + translate，200ms standard。
        // 默认按元素序号取偏移：第 1 个向上让 40px、第 2 个起向下让 40px（官方越界重复最后一个）
        dragBetweenEnter: function (target, offset) {
            var nodes = flat(target);
            return Promise.all(nodes.map(function (node, i) {
                var off = offset || (i === 0 ? { top: '-40px', left: '0px' } : { top: '40px', left: '0px' });
                var to = 'scale(0.95) ' + offsetToTransform(off);
                return run(node, {
                    frames: [{ transform: currentTransform(node) }, { transform: to }],
                    duration: 200
                });
            })).then(function () { });
        },
        // 官方 dragBetweenLeave：间隙合上 —— 只保留 scale(0.95)，200ms standard
        dragBetweenLeave: function (target) {
            return run(target, {
                frames: [{ transform: currentTransform(target) }, { transform: 'scale(0.95)' }],
                duration: 200
            });
        },

        /* ── 滑动多选（Win8 磁贴/列表从下往上划）───────────────────────── */
        // 官方 swipeReveal：向下让出 25px 露出选择框，300ms standard
        swipeReveal: function (target, offset) {
            var to = offset ? offsetToTransform(offset) : 'translate(0px, 25px)';
            return run(target, {
                frames: [{ transform: currentTransform(target) }, { transform: to }],
                duration: 300
            });
        },
        // 官方 swipeSelect：对象滑回原位 300ms + 选择框淡入 300ms（同一曲线）
        swipeSelect: function (selected, selection) {
            return join(
                run(selected, { frames: [{ transform: currentTransform(selected) }, { transform: '' }], duration: 300 }),
                run(selection, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 300 })
            );
        },
        // 官方 swipeDeselect：对象滑回原位 300ms + 选择框淡出 300ms
        swipeDeselect: function (deselected, selection) {
            return join(
                run(deselected, { frames: [{ transform: currentTransform(deselected) }, { transform: '' }], duration: 300 }),
                run(selection, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 300 })
            );
        },

        /* ── 搜索建议列表（与普通列表区分：更快）───────────────────────── */
        // 官方 createAddToSearchListAnimation：新增项淡入 117ms linear（受影响项存在时延迟 240ms）+ 其余项 400ms 归位
        createAddToSearchListAnimation: function (added, affected) {
            added = toArray(added); affected = toArray(affected);
            var before = snapshot(affected);
            var delay = affected.length ? 240 : 0;
            return {
                execute: function () {
                    return join(
                        run(added, { frames: [{ opacity: 0 }, { opacity: 1 }], duration: 117, delay: delay, easing: EASE.linear }),
                        flip(affected, before, 400, 0)
                    );
                }
            };
        },
        // 官方 createDeleteFromSearchListAnimation：删除项淡出 93ms linear + 其余项 400ms 归位（延迟 60ms）
        createDeleteFromSearchListAnimation: function (deleted, remaining) {
            deleted = toArray(deleted); remaining = toArray(remaining);
            var before = snapshot(remaining);
            return {
                execute: function () {
                    return join(
                        run(deleted, { frames: [{ opacity: 1 }, { opacity: 0 }], duration: 93, easing: EASE.linear }),
                        flip(remaining, before, 400, deleted.length ? 60 : 0)
                    );
                }
            };
        },

        /* ── 窥视 ─────────────────────────────────────────────────────── */
        // 官方 createPeekAnimation：先记录受影响元素位置，改变布局后再让它们用 2000ms 缓慢归位
        // （官方签名保留 target 参数以兼容，实际只用到 element）
        createPeekAnimation: function (target, element) {
            var affected = toArray(element);
            var before = snapshot(affected);
            return { execute: function () { return flip(affected, before, 2000, 0); } };
        },

        /* ── 按官方枚举挑选页面转场 ──────────────────────────────────── */
        // 官方枚举 WinJS.UI.PageNavigationAnimation = { turnstile, slide, enterPage, continuum }
        // 注意：WinJS 4.x 里官方实现已退化为桩（永远只返回 enterPage）；这里按枚举文档实现完整选择
        createPageNavigationAnimations: function (currentPreferredAnimation, nextPreferredAnimation, movingBackwards) {
            var kind = nextPreferredAnimation || currentPreferredAnimation || 'enterPage';
            var noop = function () { return Promise.resolve(); };

            if (kind === 'turnstile') {
                return movingBackwards
                    ? { entrance: function (e) { return API.turnstileBackwardIn(e); }, exit: function (e) { return API.turnstileBackwardOut(e); } }
                    : { entrance: function (e) { return API.turnstileForwardIn(e); }, exit: function (e) { return API.turnstileForwardOut(e); } };
            }
            if (kind === 'slide') {
                // 官方枚举文档：slide = "The pages exit and enter using an animation that slides up/down."
                // 而官方库里纵向只有这一对：slideUp（进场）/ slideDown（出场），没有方向变体，
                // 因此正反方向使用同一对（这一点官方 4.x 的实现已退化为桩，无从对照更细的行为）。
                return {
                    entrance: function (e) { return API.slideUp(e); },
                    exit: function (e) { return API.slideDown(e); }
                };
            }
            if (kind === 'continuum') {
                return movingBackwards
                    ? { entrance: function (e) { return API.continuumBackwardIn(e); }, exit: function (e) { return API.continuumBackwardOut(e); } }
                    : { entrance: function (e) { return API.continuumForwardIn(e); }, exit: function (e) { return API.continuumForwardOut(e); } };
            }
            if (kind === 'drillIn') {
                return movingBackwards
                    ? { entrance: function (e) { return API.drillOutIncoming(e); }, exit: function (e) { return API.drillOutOutgoing(e); } }
                    : { entrance: function (e) { return API.drillInIncoming(e); }, exit: function (e) { return API.drillInOutgoing(e); } };
            }
            // 官方 enterPage 项：进场用 enterPage，出场无动画
            return { entrance: function (e, o) { return API.enterPage(e, o); }, exit: noop };
        },

        /* ── 运行期开关 ────────────────────────────────────────────────── */
        set enabled(v) { enabled = !!v; },
        get enabled() { return enabled; },
        // 官方命名：WinJS.UI.isAnimationEnabled
        set isAnimationEnabled(v) { enabled = !!v; },
        get isAnimationEnabled() { return enabled; },
        // 官方 WinJS.Utilities._fastAnimations / _slowAnimations
        // 官方命名：WinJS.Utilities._fastAnimations / _slowAnimations
        set fast(v) { factor = v ? 1 / 20 : 1; },
        get fast() { return factor === 1 / 20; },
        set slow(v) { factor = v ? 3 : 1; },
        get slow() { return factor === 3; },
        set _fastAnimations(v) { factor = v ? 1 / 20 : 1; },
        get _fastAnimations() { return factor === 1 / 20; },
        set _slowAnimations(v) { factor = v ? 3 : 1; },
        get _slowAnimations() { return factor === 3; },
        get factor() { return factor; }
    };

    /* ── 内部实现：交错滑动页 & 转门 ───────────────────────────────────── */
    function slideStaggered(page, elements, direction, sign) {
        var incoming = direction === 'in';
        var easing = incoming ? EASE.slideIn : EASE.slideOut;
        // 官方向量：slideRightIn = -innerWidth→0；slideLeftIn = +innerWidth→0；
        //           slideRightOut = 0→+innerWidth；slideLeftOut = 0→-innerWidth
        var width = global.innerWidth;
        var pageFrames = incoming
            ? [{ transform: 'translate(' + (-sign * width) + 'px, 0px)' }, { transform: 'translate(0px, 0px)' }]
            : [{ transform: 'translate(0px, 0px)' }, { transform: 'translate(' + (sign * width) + 'px, 0px)' }];

        // 官方对页面用 steps(1) 淡变 —— 页面本身不做淡入淡出，只位移
        var tasks = [run(page, { frames: pageFrames, duration: 350, easing: easing })];
        toArray(elements).forEach(function (group, groupIndex) {
            var offset = 200 * (groupIndex + 1) * (incoming ? -1 : 1) * sign;
            var frames = incoming
                ? [{ transform: 'translate(' + offset + 'px, 0px)' }, { transform: 'translate(0px, 0px)' }]
                : [{ transform: 'translate(0px, 0px)' }, { transform: 'translate(' + offset + 'px, 0px)' }];
            tasks.push(run(group, { frames: frames, duration: 350, easing: easing }));
        });
        return Promise.all(tasks).then(function () { });
    }

    // 官方 collectTurnstileTransformOrigins：左边缘外 40px、屏幕中线高度为旋转轴
    function turnstileOrigins(nodes) {
        return nodes.map(function (node) {
            var box = node.getBoundingClientRect();
            return {
                ltr: -(40 + box.left) + 'px ' + ((global.innerHeight / 2) - box.top) + 'px',
                rtl: (40 + (global.innerWidth - box.right)) + 'px ' + ((global.innerHeight / 2) - box.top) + 'px'
            };
        });
    }

    function turnstile(elements, direction, degrees, perspective) {
        var nodes = flat(elements);
        if (!nodes.length) { return Promise.resolve(); }
        var origins = turnstileOrigins(nodes);
        var delay = stagger(0, 50, 1, 1000);
        var incoming = direction === 'in';
        var duration = incoming ? 300 : 128;
        var easing = incoming ? EASE.turnstileIn : EASE.turnstileOut;

        return Promise.all(nodes.map(function (node, i) {
            var rtl = global.getComputedStyle(node).direction === 'rtl';
            node.style.transformOrigin = origins[i][rtl ? 'rtl' : 'ltr'];
            var from = incoming ? 'perspective(' + perspective + 'px) rotateY(' + degrees + 'deg)' : 'perspective(' + perspective + 'px) rotateY(0deg)';
            var to = incoming ? 'perspective(' + perspective + 'px) rotateY(0deg)' : 'perspective(' + perspective + 'px) rotateY(' + degrees + 'deg)';
            return join(
                run(node, { frames: [{ transform: from }, { transform: to }], duration: duration, delay: delay(i), easing: easing }),
                run(node, {
                    frames: incoming ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
                    duration: duration, delay: delay(i), easing: incoming ? EASE.fadeIn : EASE.fadeOut
                })
            ).then(function () { node.style.transformOrigin = ''; });
        })).then(function () { });
    }

    global.Win8Anim = API;
}(window));
