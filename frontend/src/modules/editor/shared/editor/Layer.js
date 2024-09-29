import {v4 as uuidv4} from "uuid";
import {blankTimingSetter, blankTransformSetter, emptyLayerName} from "../../consts/layerConsts";
import {Transformable} from "./Transformable";

export default class Layer {
  constructor(params) {
    this.props = {};
    this.props.transformProps = { ...blankTransformSetter, ...params.transformProps };
    this.props.timingProps = { ...blankTimingSetter, ...params.timingProps };
    this.id = uuidv4();
    this.layerName = params.layerName || emptyLayerName;
    this.position = null
    this.playerCanvas = document.getElementById('playerCanvas');
    this.canvasWrapper = document.getElementById('canvasWrapper');
    this.transformable = new Transformable();
    this.transformable.init({
      attachTo: this.canvasWrapper
    });
    this.onTransform = () => {};
    document.addEventListener('click', event => {
      const isClickInside = this.transformable.boxWrapper.contains(event.target)

      if (!isClickInside) {
        this.transformable.disable();
      } else {
        this.transformable.enable();
      }
    })
  }

  delete() {
    this.transformable.boxWrapper?.destroy?.();
  }

  setIsRecording(recording) {
    if (recording) {
      this.transformable.boxWrapper.style.display = 'none'
    } else {
      this.transformable.boxWrapper.style.display = 'unset'
    }

    this.isRecording = recording;
  }

  getCoefs() {
    const { width, height } = this.canvasWrapper.getBoundingClientRect();

    return {
      xCoef: width / this.playerCanvas.width,
      yCoef: height / this.playerCanvas.height,
    }
  }

  getLayerCoefs() {
    const { width, height } = this.canvasWrapper.getBoundingClientRect();

    return {
      xCoef: this.playerCanvas.width / width,
      yCoef: this.playerCanvas.height / height,
    }
  }

  _isRenderingTime(videoTiming) {
    const isRendering = this.props?.timingProps?.timingEnd >= videoTiming && this.props?.timingProps?.timingStart <= videoTiming;
    if (!isRendering) {
      this.transformable.disable();
    }

    return isRendering;
  }

  _getObjectInternalTransform({ width, height, canvasWidth, canvasHeight }) {
    if (!this.position) {
      const newWidth = canvasWidth - 50;
      const newHeight = height / width * newWidth;

      const {
        xCoef,
        yCoef,
      } = this.getCoefs();

      this.position = {
        x: 25,
        y: canvasHeight / 2 - newHeight / 2,
        width: newWidth,
        height: newHeight
      }

      this.transformable.resize(this.position.width * xCoef, this.position.height * yCoef);
      this.transformable.repositionElement(
        this.position.x * xCoef + this.position.width * xCoef / 2,
        this.position.y * yCoef + this.position.height * xCoef / 2,
      );

      this.transformable.onChange = ({ left, top, width, height }) => {
        const {
          xCoef,
          yCoef,
        } = this.getLayerCoefs();

        this.position = {
          x: left * xCoef - width * xCoef / 2,
          y: top * yCoef - height * yCoef / 2,
          width: width * xCoef,
          height: height * yCoef
        }
        this.onTransform(this.position);
      }
    }

    return this.position;
  }

  getResolvedLayer() {
    return {
      ...this.props,
      id: this.id,
      layerName: this.layerName
    }
  }

  goTo(canvas, videoTiming) {
    this.render(canvas, videoTiming);
  }

  render(canvas, videoTiming) {}
}