import Layer from "./Layer";
import {blankVideoSetter} from "../../consts/layerConsts";
import {v4 as uuidv4} from "uuid";

export default class VideoLayer extends Layer {
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
    this.video = document.createElement('video');
    this.props = new Proxy(this.props, {
      set: ((target, prop, newValue, receiver) => {
        try {
          if (newValue?.src && prop === 'videoProps' && this.video?.src !== newValue?.src) {
            this._setVideo(newValue.src);
          }

          if (prop === 'videoProps') {
            this.video.playbackRate = (newValue.timingEnd - newValue.timingStart) / (this.props.timingProps.timingEnd - this.props.timingProps.timingStart);
          }

          target[prop] = newValue;

          return Reflect.set(...arguments);
        } catch {
          return Reflect.set(...arguments);
        }
      }).bind(this)
    });
    this.props.videoProps = { ...params.videoProps, ...blankVideoSetter }
    this.props.transformProps.posX = 0;
    this.props.transformProps.posY = 0;
  }


  async _setVideo(src) {
    this.video.setAttribute('autoplay', "true");
    this.video.setAttribute('loop', "true");
    this.video.setAttribute('playsinline', "true");
    this.video.setAttribute('controls', "true");
    this.video.setAttribute('preload', "true");
    this.video.src = src;
    this.video.pause();

    this._isLoading = true;

    this.video.oncanplaythrough = () => {
      this._isLoading = false;
      this.video.playbackRate = (this.props.videoProps.timingEnd - this.props.videoProps.timingStart) / (this.props.timingProps.timingEnd - this.props.timingProps.timingStart);

      for (const listener of Object.values(this._onLoadListeners)) {
        listener();
      }
      this.video.oncanplaythrough = null;
    }
  }

  getResolvedLayer() {
    return {
      ...this.props,
      id: this.id,
      layerName: this.layerName
    }
  }

  getVideoTiming = (timing) => {
    const videoPart = (timing - this.props.timingProps.timingStart) / (this.props.timingProps.timingEnd - this.props.timingProps.timingStart);

    return (this.props.videoProps.timingStart + (this.props.videoProps.timingEnd - this.props.videoProps.timingStart) * videoPart) / 1000;
  }

  stop = (videoTiming) => {
    this.video.currentTime = this.getVideoTiming(videoTiming);
    this.video.pause();
  }

  play = (videoTiming) => {
    this.video.currentTime = this.getVideoTiming(videoTiming);
    return this.video.play();
  }

  goTo = (videoTiming) => {
    return new Promise(((resolve) => {
      if (!this.video || !this.video?.src || !this.video?.duration) {
        resolve();
      }

      const onSeek = (async () => {
        this.video.removeEventListener('seeked', onSeek);
        resolve();
      }).bind(this);

      this.video.addEventListener('seeked', onSeek);
      this.video.currentTime = this.getVideoTiming(videoTiming);
    }).bind(this))
  }

  render(canvas, videoTiming) {
    if (!this.video?.src || this._isLoading) {
      const onFirstRender = () => {
        this.render(canvas, videoTiming);
        this.removeOnLoadListener(this._onFirstRenderId);
      }

      this._onFirstRenderId = this.addOnLoadListener(onFirstRender.bind(this));
      return;
    }

    if (this._isRenderingTime(videoTiming)) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width
      newCanvas.height = canvas.height
      const { x, y, height, width } = this._getObjectInternalTransform({
        width: this.video.videoWidth,
        height: this.video.videoHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });
      const context = newCanvas.getContext('2d');

      context.drawImage(
        this.video,
        x,
        y,
        width,
        height
      );
      const targetContext = canvas.getContext('2d');
      targetContext.drawImage(
        newCanvas,
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.restore()
    }
  }
}