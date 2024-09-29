/* eslint-disable */
export class Transformable {
    currentDegree = 0
    degreeOffset = 0
    degreeCenter = { x: 0, y: 0 }

    initElements() {
        this.box = document.createElement("div")
        this.boxWrapper = document.createElement("div")
        this.boxWrapper.classList.add("media-editor-transformable-wrapper")
        this.box.classList.add("media-editor-transformable-box")
        this.box.style.position = "absolute"
        this.box.style.zIndex = "20"
        this.box.style.display = "flex"
        this.boxWrapper.append(this.box)

        this.rightMid = document.createElement("div")
        this.rightMid.classList.add("media-editor-transformable-box-right-mid")
        this.leftMid = document.createElement("div")
        this.leftMid.classList.add("media-editor-transformable-box-left-mid")
        this.topMid = document.createElement("div")
        this.topMid.classList.add("media-editor-transformable-box-top-mid")
        this.bottomMid = document.createElement("div")
        this.bottomMid.classList.add("media-editor-transformable-box-bottom-mid")

        this.leftTop = document.createElement("div")
        this.leftTop.classList.add("media-editor-transformable-box-left-top")
        this.rightTop = document.createElement("div")
        this.rightTop.classList.add("media-editor-transformable-box-right-top")
        this.rightBottom = document.createElement("div")
        this.rightBottom.classList.add(
            "media-editor-transformable-box-right-bottom"
        )
        this.leftBottom = document.createElement("div")
        this.leftBottom.classList.add("media-editor-transformable-box-left-bottom")

        this.rotateRightTop = document.createElement("div")
        this.rotateRightTop.classList.add(
            "media-editor-transformable-box-rotate-right-top"
        )
        this.rotateLeftTop = document.createElement("div")
        this.rotateLeftTop.classList.add(
            "media-editor-transformable-box-rotate-left-top"
        )
        this.rotateRightBottom = document.createElement("div")
        this.rotateRightBottom.classList.add(
            "media-editor-transformable-box-rotate-right-bottom"
        )
        this.rotateLeftBottom = document.createElement("div")
        this.rotateLeftBottom.classList.add(
            "media-editor-transformable-box-rotate-left-bottom"
        )

        this.resizableElement = document.createElement("div")
        this.resizableElement.classList.add("media-editor-transformable-box-resize")

        this.boxContent = document.createElement("div")
        this.boxContent.classList.add("media-editor-transformable-box-content")

        this.box.append(
            this.resizableElement,
            this.leftTop,
            this.rightTop,
            this.rightBottom,
            this.leftBottom,
            this.boxContent
        )
    }

    enableHighlight() {
        this.highlightBlur = document.createElement("div")
        this.highlightBlur.style.position = "absolute"
        this.highlightBlur.style.top = this.highlightBlur.style.left = "0"
        this.highlightBlur.style.width = this.highlightBlur.style.height = "100%"
        this.highlightBlur.style.background = "#D9D9D9"
        this.highlightBlur.style.opacity = "0.3"
        this.highlightBlur.style.pointerEvents = "none"
        this.highlight = document.createElement("div")
        this.highlight.style.zIndex = "30"
        this.highlight.style.position = "absolute"
        this.highlight.style.top = this.highlight.style.left = "0"
        this.highlight.style.width = this.highlight.style.height = "100%"
        this.highlight.style.background = "white"
        this.highlight.style.opacity = "0.3"
        this.highlight.style.pointerEvents = "none"

        this.attachTo.append(this.highlightBlur)
        this.box.append(this.highlight)
    }

    disableHighlight() {
        if (!this.highlightBlur) return

        this.highlightBlur.remove()
        this.highlight.remove()
    }

    disable() {
        this.resizableElement.style.display = "none"
        this.leftTop.style.display = "none"
        this.rightTop.style.display = "none"
        this.rightBottom.style.display = "none"
        this.leftBottom.style.display = "none"
        // this.boxWrapper.style.pointerEvents = "none"
    }

    enable() {
        this.resizableElement.style.display = "flex"
        this.leftTop.style.display = "unset"
        this.rightTop.style.display = "unset"
        this.rightBottom.style.display = "unset"
        this.leftBottom.style.display = "unset"
        this.boxWrapper.style.pointerEvents = "unset"
    }

    rotation(event) {
        event.preventDefault()
        event.stopPropagation()

        const angle =
            Math.atan2(
                event.clientY - this.degreeCenter.y,
                event.clientX - this.degreeCenter.x
            ) +
            Math.PI / 2

        this.currentDegree = (angle * 180) / Math.PI - this.degreeOffset
        this.boxWrapper.style.transform = `rotate(${this.currentDegree}deg)`

        if (this.onChange) {
            this.onChange(this.getCurrnetTransform())
        }
    }

    getCurrnetTransform() {
        function getCurrentRotation(el) {
            try {
              var st = window.getComputedStyle(el, null)
              var tm =
                st.getPropertyValue("-webkit-transform") ||
                st.getPropertyValue("-moz-transform") ||
                st.getPropertyValue("-ms-transform") ||
                st.getPropertyValue("-o-transform") ||
                st.getPropertyValue("transform")
              ;("none")
              if (tm != "none") {
                var values = tm
                  .split("(")[1]
                  .split(")")[0]
                  .split(",")
                var angle = Math.round(
                  Math.atan2(+values[1], +values[0]) * (180 / Math.PI)
                )
                return angle < 0 ? angle + 360 : angle
              }
              return 0
            } catch {
              return 0;
            }
        }
        const attachToBox = this.attachTo.getBoundingClientRect()

        return {
            left: +this.boxWrapper.style.left.replace("px", ""),
            top: +this.boxWrapper.style.top.replace("px", ""),
            width: this.boxContent.clientWidth,
            height: this.boxContent.clientHeight,
            rotation: getCurrentRotation(this.boxWrapper),
            containerWidth: attachToBox.width,
            containerHeight: attachToBox.height
        }
    }

    init({ attachTo, children, options }) {
        const {
            minWidth = 200,
            minHeight = 200,
            width = 200,
            height = 200,
            left = attachTo?.clientLeft + attachTo?.clientWidth / 2,
            top = attachTo?.clientTop + attachTo?.clientHeight / 2,
            aspectRatio
        } = options || {}

        this.aspectRatio = aspectRatio
        this.minWidth = this.initialMinWidth = minWidth
        this.minHeight = this.initialMinHeight = minHeight
        this.initialWidth = width
        this.initialHeight = height
        this.initialLeft = left
        this.initialTop = top
        this.resize = () => {}
        this.repositionElement = () => {}

        this.attachToInitialHeight = attachTo?.getBoundingClientRect().height
        this.attachToInitialWidth = attachTo?.getBoundingClientRect().width

        this.initElements()

        let initX
        let initY
        let mousePressX
        let mousePressY
        let initW
        let initH
        let initRotate

        this.attachTo = attachTo
        this.attachTo.append(this.boxWrapper)
        if (children) {
          this.boxContent.append(children)
        }

        const repositionElement = (x, y, save = true) => {
            try {
              this.boxWrapper.style.left = x + "px"
              this.boxWrapper.style.top = y + "px"

              if (this.onChange) {
                this.onChange(this.getCurrnetTransform())
              }

              if (save) {
                this.x = x
                this.y = y
              }
            } catch {}
        }
        this.repositionElement = repositionElement.bind(this)

        const resize = (w, h, save = true) => {
            this.box.style.width =
                (this.aspectRatio ? h * this.aspectRatio : w) + "px"
            this.box.style.height = h + "px"

            if (save) {
                this.width = this.aspectRatio ? h * this.aspectRatio : w
                this.height = h
            }

            if (this.onChange) {
                this.onChange(this.getCurrnetTransform())
            }

            this.resizableElement.style.backgroundImage = `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='${(this
                .aspectRatio
                ? h * this.aspectRatio
                : w) + 8}' height='${h +
            8}' x='2' y='2' fill='none' stroke='hsla(0, 0%, 100%, 0.2)' stroke-width='2' stroke-dasharray='6%2c 14' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`
        }
        this.resize = resize.bind(this);

        function getCurrentRotation(el) {
            var st = window.getComputedStyle(el, null)
            var tm =
                st.getPropertyValue("-webkit-transform") ||
                st.getPropertyValue("-moz-transform") ||
                st.getPropertyValue("-ms-transform") ||
                st.getPropertyValue("-o-transform") ||
                st.getPropertyValue("transform")
            ;("none")
            if (tm != "none") {
                var values = tm
                    .split("(")[1]
                    .split(")")[0]
                    .split(",")
                var angle = Math.round(
                    Math.atan2(+values[1], +values[0]) * (180 / Math.PI)
                )
                return angle < 0 ? angle + 360 : angle
            }
            return 0
        }

        this.boxWrapper.addEventListener(
            "mousedown",
            event => {
                if (event.target.className.indexOf("dot") > -1) {
                    return
                }

                initX = this.boxWrapper.offsetLeft
                initY = this.boxWrapper.offsetTop
                mousePressX = event.x
                mousePressY = event.y

                function eventMoveHandler(event) {
                    repositionElement(
                        initX + (event.clientX - mousePressX),
                        initY + (event.clientY - mousePressY)
                    )
                }

                const onMouseUp = () => {
                    document.removeEventListener("mousemove", eventMoveHandler, false)
                    document.removeEventListener("mouseup", onMouseUp)
                }

                document.addEventListener("mousemove", eventMoveHandler, false)
                document.addEventListener("mouseup", onMouseUp, false)
            },
            false
        )

        var rightMid = this.rightMid
        var leftMid = this.leftMid
        var topMid = this.topMid
        var bottomMid = this.bottomMid

        var leftTop = this.leftTop
        var rightTop = this.rightTop
        var rightBottom = this.rightBottom
        var leftBottom = this.leftBottom

        const resizeObserver = new ResizeObserver(
            (() => {
                const attachToBox = this.attachTo.getBoundingClientRect()

                const deltaWidth = attachToBox.width / this.attachToInitialWidth
                const deltaHeight = attachToBox.height / this.attachToInitialHeight
                this.minHeight = this.initialMinHeight * deltaHeight
                this.minWidth = this.initialMinWidth * deltaWidth

                repositionElement(this.x * deltaWidth, this.y * deltaHeight, false)
                resize(this.width * deltaWidth, this.height * deltaHeight, false)
            }).bind(this)
        )
        resizeObserver.observe(this.attachTo)

        const resizeHandler = (
            event,
            left = false,
            top = false,
            xResize = false,
            yResize = false
        ) => {
            initX = event.target.offsetLeft
            initY = event.target.offsetTop
            mousePressX = event.clientX
            mousePressY = event.clientY

            initW = this.box.offsetWidth
            initH = this.box.offsetHeight

            initRotate = getCurrentRotation(this.boxWrapper)
            var initRadians = (initRotate * Math.PI) / 180
            var cosFraction = Math.cos(initRadians)
            var sinFraction = Math.sin(initRadians)
            const eventMoveHandler = event => {
                var hDiff = event.clientY - mousePressY
                var wDiff = event.clientX - mousePressX

                var rotatedWDiff = cosFraction * wDiff + sinFraction * hDiff
                var rotatedHDiff = cosFraction * hDiff - sinFraction * wDiff

                var newW = initW,
                    newH = initH,
                    newX = initX,
                    newY = initY

                if (yResize) {
                    if (top) {
                        newH = initH - rotatedHDiff
                        if (newH < this.minHeight) {
                            newH = this.minHeight
                            rotatedHDiff = initH - this.minHeight
                        }
                    } else {
                        newH = initH + rotatedHDiff
                        if (newH < this.minHeight) {
                            newH = this.minHeight
                            rotatedHDiff = this.minHeight - initH
                        }
                    }
                    newX -= 0.5 * rotatedHDiff * sinFraction
                    newY += 0.5 * rotatedHDiff * cosFraction
                }

                if (xResize) {
                    if (left) {
                        newW = initW - rotatedWDiff

                        if (this.aspectRatio) {
                            newW = this.aspectRatio * newH
                            rotatedWDiff = initW - newW
                        } else if (newW < this.minWidth) {
                            newW = this.minWidth
                            rotatedWDiff = initW - this.minWidth
                        }
                    } else {
                        newW = initW + rotatedWDiff

                        if (this.aspectRatio) {
                            newW = this.aspectRatio * newH
                            rotatedWDiff = newW - initW
                        } else if (newW < this.minWidth) {
                            newW = this.minWidth
                            rotatedWDiff = this.minWidth - initW
                        }
                    }
                    newX += 0.5 * rotatedWDiff * cosFraction
                    newY += 0.5 * rotatedWDiff * sinFraction
                }

                resize(newW, newH)
                repositionElement(newX, newY)
            }

            window.addEventListener("mousemove", eventMoveHandler, false)
            window.addEventListener(
                "mouseup",
                function eventEndHandler() {
                    window.removeEventListener("mousemove", eventMoveHandler, false)
                    window.removeEventListener("mouseup", eventEndHandler)
                },
                false
            )
        }

        rightMid.addEventListener("mousedown", e =>
            resizeHandler(e, false, false, true, false)
        )
        leftMid.addEventListener("mousedown", e =>
            resizeHandler(e, true, false, true, false)
        )
        topMid.addEventListener("mousedown", e =>
            resizeHandler(e, false, true, false, true)
        )
        bottomMid.addEventListener("mousedown", e =>
            resizeHandler(e, false, false, false, true)
        )
        leftTop.addEventListener("mousedown", e =>
            resizeHandler(e, true, true, true, true)
        )
        rightTop.addEventListener("mousedown", e =>
            resizeHandler(e, false, true, true, true)
        )
        rightBottom.addEventListener("mousedown", e =>
            resizeHandler(e, false, false, true, true)
        )
        leftBottom.addEventListener("mousedown", e =>
            resizeHandler(e, true, false, true, true)
        )

        ;[
            this.rotateRightTop,
            this.rotateLeftBottom,
            this.rotateRightBottom,
            this.rotateLeftTop
        ].map(element => {
            element.addEventListener(
                "mousedown",
                event => {
                    event.stopPropagation()

                    initX = this.rotateRightTop.offsetLeft
                    initY = this.rotateRightTop.offsetTop
                    mousePressX = event.clientX
                    mousePressY = event.clientY

                    var arrow = this.box
                    var arrowRects = arrow.getBoundingClientRect()
                    var arrowX = arrowRects.left + arrowRects.width / 2
                    var arrowY = arrowRects.top + arrowRects.height / 2

                    this.degreeCenter = { x: arrowX, y: arrowY }
                    this.degreeOffset =
                        ((Math.atan2(
                                    event.clientY - this.degreeCenter.y,
                                    event.clientX - this.degreeCenter.x
                                ) +
                                Math.PI / 2) *
                            180) /
                        Math.PI -
                        this.currentDegree

                    const rotation = this.rotation.bind(this)

                    const eventEndHandler = () => {
                        window.removeEventListener("mousemove", rotation, false)
                        window.removeEventListener("mouseup", eventEndHandler)
                    }

                    window.addEventListener("mousemove", rotation, false)
                    window.addEventListener("mouseup", eventEndHandler, false)
                },
                false
            )
        })

        resize(this.initialWidth, this.initialHeight)
        repositionElement(this.initialLeft, this.initialTop)
    }
}
