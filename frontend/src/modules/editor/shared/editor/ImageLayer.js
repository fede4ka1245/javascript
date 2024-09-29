import Layer from "./Layer";
import {blankImageSetter} from "../../consts/layerConsts";
import {v4 as uuidv4} from "uuid";

export default class ImageLayer extends Layer {
  _onLoadListeners = {};
  addOnLoadListener(func) {
    const id = uuidv4();

    this._onLoadListeners[id] = () => {
      delete this._onLoadListeners[id];
      func();
    }

    return id;
  }

  removeOnLoadListener(id) {
    delete this._onLoadListeners[id];
  }

  constructor(params) {
    super(params);
    this.props.imageProps = { ...blankImageSetter, ...params.imageProps };
    this.props.transformProps.posX = 0;
    this.props.transformProps.posY = 0;

    this.props = new Proxy(this.props, {
      set: ((target, prop, newValue, receiver) => {
        if (prop === 'imageProps' && newValue?.src && this.img?.src !== newValue?.src) {
          this.img = new Image();
          this.img.src = newValue.src;
        } else if (prop === 'imageProps' && newValue?.src && this.img?.src === newValue?.src) {
          return Reflect.set(...arguments);
        }

        target[prop] = newValue;

        return Reflect.set(...arguments);
      }).bind(this)
    })
  }

  render(canvas, videoTiming) {
    if (!this.img?.complete) {
      if (this.img) {
        this.img.onload = (() => {
          for (const listener of Object.values(this._onLoadListeners)) {
            listener();
          }
          this.render(canvas, videoTiming);
          this.img.onload = null;
        }).bind(this);
      }
      return;
    }

    if (this._isRenderingTime(videoTiming)) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width
      newCanvas.height = canvas.height
      const { x, y, height, width } = this._getObjectInternalTransform({
        width: this.img.naturalWidth,
        height: this.img.naturalHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });
      const context = newCanvas.getContext('2d');

      context.drawImage(
        this.img,
        x,
        y,
        width,
        height
      );

      const targetContext = canvas.getContext('2d');
      targetContext.drawImage(newCanvas, 0, 0, canvas.width, canvas.height);

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.restore()
    }
  }
}