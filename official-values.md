# Windows 8 / WinJS 官方动画参数表

从微软 MIT 许可的 WinJS 源码 `src/js/WinJS/Animations.js`（命名空间 `WinJS.UI.Animation`）逐条提取，未经改动。时间是毫秒；运行时会把数值乘以 `_animationFactor`（对应系统「关闭不必要的动画」设置）。

| # | 动画 | 说明 | 属性 | 关键帧 | 时长 | 延迟 | 缓动曲线 | from → to |
|---|------|------|------|--------|------|------|----------|-----------|
| 1 | `getOffset` |  | `transformNames.cssName` | `-` | 350 ms | 0 | `curve` | `translateCallback(startOffsetArray)` → `translateCallback(endOffsetArray)` |
| 2 | `getOffset` |  | `"opacity"` | `-` | 350 ms | 0 | `fadeIn ? "steps(1, start)" : "steps(1, end)"` | `fadeIn ? 0 : 1` → `fadeIn ? 1 : 0` |
| 3 | `ExpandAnimation` |  | `"opacity"` | `"WinJS-opacity-in"` | 167 ms | this.affectedArray.length > 0 ? 200 : 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 4 | `ExpandAnimation` |  | `transformNames.cssName` | `-` | 367 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 5 | `CollapseAnimation` |  | `"opacity"` | `"WinJS-opacity-out"` | 167 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `1` → `0` |
| 6 | `CollapseAnimation` |  | `transformNames.cssName` | `-` | 367 ms | this.hiddenArray.length > 0 ? 167 : 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 7 | `RepositionAnimation` |  | `transformNames.cssName` | `-` | 367 ms | staggerDelay(0, 33, 1, 250) | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 8 | `AddToListAnimation` |  | `transformNames.cssName` | `"WinJS-scale-up"` | 120 ms | delay | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `"scale(0.85)"` → `"none"` |
| 9 | `AddToListAnimation` |  | `"opacity"` | `"WinJS-opacity-in"` | 120 ms | delay | `"linear"` | `0` → `1` |
| 10 | `AddToListAnimation` |  | `transformNames.cssName` | `-` | 400 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 11 | `DeleteFromListAnimation` |  | `transformNames.cssName` | `"WinJS-scale-down"` | 120 ms | 0 | `"cubic-bezier(0.11, 0.5, 0.24, .96)"` | `"none"` → `"scale(0.85)"` |
| 12 | `DeleteFromListAnimation` |  | `"opacity"` | `"WinJS-opacity-out"` | 120 ms | 0 | `"linear"` | `1` → `0` |
| 13 | `DeleteFromListAnimation` |  | `transformNames.cssName` | `-` | 400 ms | this.deletedArray.length > 0 ? 60 : 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 14 | `_UpdateListAnimation` |  | `transformNames.cssName` | `keyframeCallbackAnimate(this.deletedOffsetArray, "WinJS-scale-down")` | 120 ms | 0 | `"cubic-bezier(0.11, 0.5, 0.24, .96)"` | `translateCallbackAnimate(this.deletedOffsetArray)` → `translateCallbackAnimate(this.deletedOffsetArray, "scale(0.85)")` |
| 15 | `_UpdateListAnimation` |  | `"opacity"` | `"WinJS-opacity-out"` | 120 ms | 0 | `"linear"` | `1` → `0` |
| 16 | `_UpdateListAnimation` |  | `transformNames.cssName` | `-` | 400 ms | delay | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 17 | `_UpdateListAnimation` |  | `transformNames.cssName` | `"WinJS-scale-up"` | 120 ms | delay | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `"scale(0.85)"` → `"none"` |
| 18 | `_UpdateListAnimation` |  | `"opacity"` | `"WinJS-opacity-in"` | 120 ms | delay | `"linear"` | `0` → `1` |
| 19 | `AddToSearchListAnimation` |  | `"opacity"` | `"WinJS-opacity-in"` | 117 ms | this.affectedArray.length > 0 ? 240 : 0 | `"linear"` | `0` → `1` |
| 20 | `AddToSearchListAnimation` |  | `transformNames.cssName` | `-` | 400 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 21 | `DeleteFromSearchListAnimation` |  | `"opacity"` | `"WinJS-opacity-out"` | 93 ms | 0 | `"linear"` | `1` → `0` |
| 22 | `DeleteFromSearchListAnimation` |  | `transformNames.cssName` | `-` | 400 ms | this.deletedArray.length > 0 ? 60 : 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 23 | `PeekAnimation` |  | `transformNames.cssName` | `-` | 2000 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 24 | `PeekAnimation` |  | `` | `-` | 350 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `-` |
| 25 | `PeekAnimation` |  | `` | `-` | 120 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `-` |
| 26 | `PeekAnimation` |  | `` | `-` | args.duration === undefined ? defaultTransition.duration : args.duration ms | 0 | `args.timing === undefined ? defaultTransition.timing : args.timing` | `-` → `-` |
| 27 | `PeekAnimation` |  | `` | `-` | args.duration ms | 0 | `args.timing` | `-` → `-` |
| – | `createExpandAnimation` | Creates an expand animation. | – | – | – | – | 组合动画工厂 | – |
| – | `createCollapseAnimation` | Creates a collapse animation. | – | – | – | – | 组合动画工厂 | – |
| – | `createRepositionAnimation` | Creates a reposition animation. | – | – | – | – | 组合动画工厂 | – |
| 28 | `fadeIn` | Execute a fade-in animation. | `"opacity"` | `-` | 250 ms | 0 | `"linear"` | `0` → `1` |
| 29 | `fadeOut` | Execute a fade-out animation. | `"opacity"` | `-` | 167 ms | 0 | `"linear"` | `-` → `0` |
| – | `createAddToListAnimation` | Creates an animation for adding to a list. | – | – | – | – | 组合动画工厂 | – |
| – | `createDeleteFromListAnimation` | Crestes an animation for deleting from a lis | – | – | – | – | 组合动画工厂 | – |
| – | `_createUpdateListAnimation` |  | – | – | – | – | 组合动画工厂 | – |
| – | `createAddToSearchListAnimation` | Creates an animation for adding to a list of | – | – | – | – | 组合动画工厂 | – |
| – | `createDeleteFromSearchListAnimation` | Creates an animation for deleting from a lis | – | – | – | – | 组合动画工厂 | – |
| 30 | `showEdgeUI` | Slides an element or elements into position  | `transformNames.cssName` | `offsetArray.keyframe` | 367 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `isTransition ? translateCallback(offsetArray) : (offsetArray.keyframe || translateCallback(offsetArray))` → `"none"` |
| 31 | `showPanel` | Slides an element or elements into position  | `transformNames.cssName` | `offsetArray.keyframe` | 550 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray)` → `"none"` |
| 32 | `hideEdgeUI` | Slides an element or elements at the edge of | `transformNames.cssName` | `offsetArray.keyframe` | 367 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `"none"` → `isTransition ? translateCallback(offsetArray) : (offsetArray.keyframe || translateCallback(offsetArray))` |
| 33 | `hidePanel` | Slides an element or elements at the edge of | `transformNames.cssName` | `offsetArray.keyframe` | 550 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `"none"` → `offsetArray.keyframe || translateCallback(offsetArray)` |
| 34 | `showPopup` | Displays an element or elements in the style | `"opacity"` | `"WinJS-opacity-in"` | 83 ms | 83 | `"linear"` | `0` → `1` |
| 35 | `showPopup` | Displays an element or elements in the style | `transformNames.cssName` | `offsetArray.keyframe` | 367 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray)` → `"none"` |
| 36 | `hidePopup` | Removes a popup from the screen. | `"opacity"` | `"WinJS-opacity-out"` | 83 ms | 0 | `"linear"` | `1` → `0` |
| 37 | `pointerDown` | Execute a pointer-down animation. | `transformNames.cssName` | `-` | 167 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `"scale(0.975, 0.975)"` |
| 38 | `pointerUp` | Execute a pointer-up animation. | `transformNames.cssName` | `-` | 167 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 39 | `dragSourceStart` | Execute a drag-start animation. | `transformNames.cssName` | `-` | 240 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `"scale(1.05)"` |
| 40 | `dragSourceStart` | Execute a drag-start animation. | `"opacity"` | `-` | 240 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `0.65` |
| 41 | `dragSourceStart` | Execute a drag-start animation. | `transformNames.cssName` | `-` | 240 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `"scale(0.95)"` |
| 42 | `dragSourceEnd` | Execute a drag-end animation. | `transformNames.cssName` | `-` | 500 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `"" // this removes the scale` |
| 43 | `dragSourceEnd` | Execute a drag-end animation. | `"opacity"` | `-` | 500 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `1` |
| 44 | `dragSourceEnd` | Execute a drag-end animation. | `transformNames.cssName` | `offsetArray.keyframe` | 500 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray, "scale(1.05) ")` → `"none"` |
| 45 | `dragSourceEnd` | Execute a drag-end animation. | `transformNames.cssName` | `-` | 500 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 46 | `enterContent` | Execute an enter-content animation. | `transformNames.cssName` | `-` | 550 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `translateCallback(offsetArray)` → `"none"` |
| 47 | `enterContent` | Execute an enter-content animation. | `"opacity"` | `-` | 170 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 48 | `enterContent` | Execute an enter-content animation. | `transformNames.cssName` | `offsetArray.keyframe` | 550 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray)` → `"none"` |
| 49 | `enterContent` | Execute an enter-content animation. | `"opacity"` | `-` | 170 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 50 | `exitContent` | Execute an exit-content animation. | `transformNames.cssName` | `offsetArray.keyframe` | 117 ms | 0 | `"linear"` | `"none"` → `offsetArray.keyframe || translateCallback(offsetArray)` |
| 51 | `exitContent` | Execute an exit-content animation. | `"opacity"` | `-` | 117 ms | 0 | `"linear"` | `-` → `0` |
| 52 | `dragBetweenEnter` | Execute an animation which indicates that a  | `transformNames.cssName` | `-` | 200 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `translateCallback(offsetArray, "scale(0.95) ")` |
| 53 | `dragBetweenLeave` | Execute an animation which indicates that a  | `transformNames.cssName` | `-` | 200 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `"scale(0.95)"` |
| 54 | `swipeSelect` | Slide a swipe-selected object back into posi | `transformNames.cssName` | `-` | 300 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 55 | `swipeSelect` | Slide a swipe-selected object back into posi | `"opacity"` | `"WinJS-opacity-in"` | 300 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 56 | `swipeDeselect` | Slide a swipe-deselected object back into po | `transformNames.cssName` | `-` | 300 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `""` |
| 57 | `swipeDeselect` | Slide a swipe-deselected object back into po | `"opacity"` | `"WinJS-opacity-out"` | 300 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `1` → `0` |
| 58 | `swipeReveal` | Reveal an object as the result of a swipe, o | `transformNames.cssName` | `-` | 300 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `-` → `translateCallback(offsetArray)` |
| 59 | `enterPage` | Execute an enterPage animation. | `transformNames.cssName` | `offsetArray.keyframe` | 1000 ms | staggerDelay(0, 83, 1, 333) | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray)` → `"none"` |
| 60 | `enterPage` | Execute an enterPage animation. | `"opacity"` | `-` | 170 ms | staggerDelay(0, 83, 1, 333) | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 61 | `exitPage` | Execute an exitPage animation. | `transformNames.cssName` | `offsetArray.keyframe` | 117 ms | 0 | `"linear"` | `"none"` → `offsetArray.keyframe || translateCallback(offsetArray)` |
| 62 | `exitPage` | Execute an exitPage animation. | `"opacity"` | `-` | 117 ms | 0 | `"linear"` | `-` → `0` |
| 63 | `crossFade` | Execute a crossFade animation. | `"opacity"` | `-` | 167 ms | 0 | `"linear"` | `-` → `1` |
| 64 | `crossFade` | Execute a crossFade animation. | `"opacity"` | `-` | 167 ms | 0 | `"linear"` | `-` → `0` |
| – | `createPeekAnimation` | Creates a peek animation. | – | – | – | – | 组合动画工厂 | – |
| 65 | `updateBadge` | Execute an updateBadge animation. | `"opacity"` | `"WinJS-opacity-in"` | 367 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `0` → `1` |
| 66 | `updateBadge` | Execute an updateBadge animation. | `transformNames.cssName` | `offsetArray.keyframe` | 1333 ms | 0 | `"cubic-bezier(0.1, 0.9, 0.2, 1)"` | `offsetArray.keyframe || translateCallback(offsetArray)` → `"none"` |
| 67 | `turnstileForwardIn` | Execute a turnstile forward in animation. | `transformNames.cssName` | `-` | 300 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0.01,0.975,0.4775,0.9775)"` | `"perspective(600px) rotateY(80deg)"` → `"perspective(600px) rotateY(0deg)"` |
| 68 | `turnstileForwardIn` | Execute a turnstile forward in animation. | `"opacity"` | `-` | 300 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 69 | `turnstileForwardOut` | Execute a turnstile forward out animation. | `transformNames.cssName` | `-` | 128 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0.4925,0.01,0.7675,-0.01)"` | `"perspective(600px) rotateY(0deg)"` → `"perspective(600px) rotateY(-50deg)"` |
| 70 | `turnstileForwardOut` | Execute a turnstile forward out animation. | `"opacity"` | `-` | 128 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 71 | `turnstileBackwardIn` | Execute a turnstile backwards in animation. | `transformNames.cssName` | `-` | 300 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0.01,0.975,0.4775,0.9775)"` | `"perspective(600px) rotateY(-50deg)"` → `"perspective(600px) rotateY(0deg)"` |
| 72 | `turnstileBackwardIn` | Execute a turnstile backwards in animation. | `"opacity"` | `-` | 300 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 73 | `turnstileBackwardOut` | Execute a turnstile backward out animation. | `transformNames.cssName` | `-` | 128 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(0.4925,0.01,0.7675,-0.01)"` | `"perspective(800px) rotateY(0deg)"` → `"perspective(800px) rotateY(80deg)"` |
| 74 | `turnstileBackwardOut` | Execute a turnstile backward out animation. | `"opacity"` | `-` | 128 ms | staggerDelay(0, 50, 1, 1000) | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 75 | `slideDown` | Execute a slide down animation. | `transformNames.cssName` | `-` | 250 ms | 0 | `"cubic-bezier(0.3825,0.0025,0.8775,-0.1075)"` | `"translate(0px, 0px)"` → `"translate(0px, 200px)"` |
| 76 | `slideDown` | Execute a slide down animation. | `"opacity"` | `-` | 250 ms | 0 | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 77 | `slideUp` | Execute a slide up animation. | `transformNames.cssName` | `-` | 350 ms | 0 | `"cubic-bezier(0.17,0.79,0.215,1.0025)"` | `"translate(0px, 200px)"` → `"translate(0px, 0px)"` |
| 78 | `slideUp` | Execute a slide up animation. | `"opacity"` | `-` | 350 ms | staggerDelay(0, 34, 1, 1000) | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| – | `slideRightIn` | Execute a slide in from left to right animat | – | – | – | – | animStaggeredSlide("cubic-bezier(0.17,0.79,0.215,1.0025)", -_Global.innerWidth, 0, true, ) | – |
| – | `slideRightOut` | Execute a slide out from left to right anima | – | – | – | – | animStaggeredSlide("cubic-bezier(0.3825,0.0025,0.8775,-0.1075)", 0, _Global.innerWidth, f) | – |
| – | `slideLeftIn` | Execute a slide in from right to left animat | – | – | – | – | animStaggeredSlide("cubic-bezier(0.17,0.79,0.215,1.0025)", _Global.innerWidth, 0, true, p) | – |
| – | `slideLeftOut` | Execute a slide out from right to left anima | – | – | – | – | animStaggeredSlide("cubic-bezier(0.3825,0.0025,0.8775,-0.1075)", 0, -_Global.innerWidth, ) | – |
| 79 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `transformNames.cssName` | `-` | 350 ms | 0 | `"cubic-bezier(0.33, 0.18, 0.11, 1)"` | `"scale(0.5, 0.5)"` → `"scale(1.0, 1.0)"` |
| 80 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `"opacity"` | `-` | 350 ms | 0 | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 81 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `transformNames.cssName` | `-` | 350 ms | 0 | `"cubic-bezier(0.24,1.15,0.11,1.1575)"` | `"translate(0px, 225px)"` → `"translate(0px, 0px)"` |
| 82 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `"opacity"` | `-` | 350 ms | 0 | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 83 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `transformNames.cssName` | `-` | 350 ms | 0 | `"cubic-bezier(0,0.62,0.8225,0.9625)"` | `"rotateX(80deg) scale(1.5, 1.5)"` → `"rotateX(0deg) scale(1.0, 1.0)"` |
| 84 | `continuumForwardIn` | Execute a continuum animation, scaling up th | `"opacity"` | `-` | 350 ms | 0 | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 85 | `continuumForwardOut` | Execute a continuum animation, scaling down  | `transformNames.cssName` | `-` | 120 ms | 0 | `"cubic-bezier(0.3825,0.0025,0.8775,-0.1075)"` | `"scale(1.0, 1.0)"` → `"scale(1.1, 1.1)"` |
| 86 | `continuumForwardOut` | Execute a continuum animation, scaling down  | `"opacity"` | `-` | 120 ms | 0 | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 87 | `continuumForwardOut` | Execute a continuum animation, scaling down  | `transformNames.cssName` | `-` | 152 ms | 0 | `"cubic-bezier(0.3825,0.0025,0.8775,-0.1075)"` | `"rotateX(0deg) scale(1.0, 1.0) translate(0px, 0px)"` → `"rotateX(80deg) scale(1.5, 1.5) translate(0px, 150px)"` |
| 88 | `continuumForwardOut` | Execute a continuum animation, scaling down  | `"opacity"` | `-` | 152 ms | 0 | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 89 | `continuumBackwardIn` | Execute a continuum animation, scaling down  | `transformNames.cssName` | `-` | 200 ms | 0 | `"cubic-bezier(0.33, 0.18, 0.11, 1)"` | `"scale(1.25, 1.25)"` → `"scale(1.0, 1.0)"` |
| 90 | `continuumBackwardIn` | Execute a continuum animation, scaling down  | `"opacity"` | `-` | 200 ms | 0 | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 91 | `continuumBackwardIn` | Execute a continuum animation, scaling down  | `transformNames.cssName` | `-` | 250 ms | 0 | `"cubic-bezier(0.2975, 0.7325, 0.4725, 0.99)"` | `"rotateX(80deg) translate(0px, -100px)"` → `"rotateX(0deg) translate(0px, 0px)"` |
| 92 | `continuumBackwardIn` | Execute a continuum animation, scaling down  | `"opacity"` | `-` | 250 ms | 0 | `"cubic-bezier(0, 2, 0, 2)"` | `0` → `1` |
| 93 | `continuumBackwardOut` | Execute a continuum animation, scaling down  | `transformNames.cssName` | `-` | 167 ms | 0 | `"cubic-bezier(0.3825,0.0025,0.8775,-0.1075)"` | `"scale(1.0, 1.0)"` → `"scale(0.5, 0.5)"` |
| 94 | `continuumBackwardOut` | Execute a continuum animation, scaling down  | `"opacity"` | `-` | 167 ms | 0 | `"cubic-bezier(1,-0.42,0.995,-0.425)"` | `1` → `0` |
| 95 | `drillInIncoming` | Execute the incoming phase of the drill in a | `transformNames.cssName` | `-` | 500 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `"scale(0.84)"` → `"scale(1.0)"` |
| 96 | `drillInIncoming` | Execute the incoming phase of the drill in a | `"opacity"` | `-` | 500 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `0` → `1` |
| 97 | `drillInOutgoing` | Execute the outgoing phase of the drill in a | `transformNames.cssName` | `-` | 233 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `"scale(1.0)"` → `"scale(1.29)"` |
| 98 | `drillInOutgoing` | Execute the outgoing phase of the drill in a | `"opacity"` | `-` | 233 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `1` → `0` |
| 99 | `drillOutIncoming` | Execute the incoming phase of the drill out  | `transformNames.cssName` | `-` | 500 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `"scale(1.29)"` → `"scale(1.0)"` |
| 100 | `drillOutIncoming` | Execute the incoming phase of the drill out  | `"opacity"` | `-` | 500 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `0` → `1` |
| 101 | `drillOutOutgoing` | Execute the outgoing phase of the drill out  | `transformNames.cssName` | `-` | 233 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `"scale(1.0)"` → `"scale(0.84)"` |
| 102 | `drillOutOutgoing` | Execute the outgoing phase of the drill out  | `"opacity"` | `-` | 233 ms | 0 | `"cubic-bezier(0.1,0.9,0.2,1)"` | `1` → `0` |
| – | `createPageNavigationAnimations` | Creates an exit and entrance animation to pl | – | – | – | – | 组合动画工厂 | – |
