import {playerConsts} from "../../consts/playerConsts";
import { v4 as uuidv4 } from 'uuid';
import RecordRTC from 'recordrtc';
import VideoLayer from "./VideoLayer";
import ImageLayer from "./ImageLayer";

export default class Player {
  constructor(canvas) {
    this.canvas = canvas;
    this.playing = false;
    this.videoTiming = 0;
    this.endVideoTiming = playerConsts.minTiming;
    this.listeners = {};
    this.layers = [];
    this.id = uuidv4();
    this.animationId = window.requestAnimationFrame(this.update.bind(this));
  }

  stop() {
    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
      if (this.layers[layerIndex] instanceof VideoLayer) {
        this.layers[layerIndex].stop(this.videoTiming);
      }
    }

    this.playing = false;
  }

  async play() {
    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
      if (this.layers[layerIndex] instanceof VideoLayer) {
        await this.layers[layerIndex].play(this.videoTiming);
      }
    }

    this.playing = true;
  }

  async goTo(videoTiming) {
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
      if (this.layers[layerIndex] instanceof VideoLayer) {
        this.layers[layerIndex].goTo(videoTiming)
          .then(() => {
            for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
              this.layers[layerIndex].render(this.canvas, this.videoTiming);
            }
          });
      }

      this.layers[layerIndex].render(this.canvas, this.videoTiming);
    }

    this.videoTiming = videoTiming;
    this.timeStart = this.time - this.videoTiming;
  }

  async update(time) {
    this.time = time;
    if (this.playing === false) {
      this.animationId = window.requestAnimationFrame(this.update.bind(this));
      if (this.timeStart) {
        this.timeStart = time - this.videoTiming;
      }
      return;
    }

    if (!this.timeStart) {
      this.timeStart = time;
    }

    this.videoTiming = time - this.timeStart;

    if (this.videoTiming >= this.endVideoTiming) {
      if (this.end) {
        this.end();
      }
      await this.goTo(0);
    }

    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex--) {
      this.layers[layerIndex].render(this.canvas, this.videoTiming);
    }

    for (const listener of Object.values(this.listeners)) {
      listener({
        videoTiming: this.videoTiming,
        endVideoTiming: this.endVideoTiming
      });
    }
    this.animationId = window.requestAnimationFrame(this.update.bind(this));
  }

  onEnd(func) {
    this.end = func;
  }

  download(onDownload) {
    const stream = this.canvas.captureStream();

    for (const layer of this.layers) {
      layer.setIsRecording(true);
      if (layer instanceof VideoLayer) {
        const newStream = layer.video.captureStream();
        for (const track of newStream.getAudioTracks()) {
          stream.addTrack(track);
        }
      }
    }

    let recorder = RecordRTC(stream, {
      mimeType: 'video/mp4'
    });

    this.stop();
    this.goTo(0);
    this.play();
    recorder.startRecording();
    this.onEnd(function() {
      recorder.stopRecording(function() {
        let blob = recorder.getBlob();

        const a = document.createElement('a');
        a.id = 'download';
        a.download = "stickernizer-sticker.webm";
        a.textContent = 'download';
        a.href = URL.createObjectURL(blob);
        a.click();

        const file = new File([blob], "stickernizer-sticker.mebm", {type: 'video/webm;codecs="vp9"'});
        onDownload(file);
      });
      this.stop();
      this.goTo(0);
      this.onEnd(null);
      for (const layer of this.layers) {
        layer.setIsRecording(false);
      }
    });
  }

  addLayer(layer) {
    const targetIndex = [...this.layers].findIndex(({ id }) => id === layer.id)

    if (layer instanceof VideoLayer || layer instanceof ImageLayer) {
      layer.addOnLoadListener(() => {
        this.goTo(this.videoTiming);
      });
      layer.onTransform = () => {
        this.goTo(this.videoTiming);
      }
    }

    if (targetIndex !== -1) {
      this.layers[targetIndex] = layer;
      this.goTo(this.videoTiming);
    } else {
      this.layers = [layer, ...this.layers];
      this.goTo(this.videoTiming);
    }
  }

  deleteLayer(layerId) {
    const layer = [...this.layers].find(({ id }) => id === layerId);
    layer.delete();
    this.layers = [...this.layers].filter(({ id }) => id !== layerId);
    this.goTo(this.videoTiming);
  }

  addListener(func) {
    const id = Date.now();
    this.listeners[id] = func;

    return id;
  }

  removeListener(id) {
    delete this.listeners[id];
  }

  destroy() {
    window.cancelAnimationFrame(this.animationId);
  }

  getLayers() {
    return this.layers;
  }

  moveLayerToNewOrder(layerOrder, newLayerOrder) {
    const result = Array.from(this.layers);
    const [removed] = result.splice(layerOrder, 1);
    result.splice(newLayerOrder, 0, removed);
    setTimeout(() => {
      this.goTo(this.videoTiming);
    }, 100);

    this.layers = result;
    return this.layers;
  }
}