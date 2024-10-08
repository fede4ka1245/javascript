import { createSlice } from '@reduxjs/toolkit'
import {tabs} from "../../consts/tabs";
import Player from "../../shared/editor/Player";
import {throttle} from "lodash";
import {playerConsts} from "../../consts/playerConsts";
import {emptyLayerName} from "../../consts/layerConsts";

const initialState = {
  tab: tabs.main,
  progress: 0,
  isPaused: true,
  isInit: false,
  layers: [],
  canvas: null,
  player: null,
  stickerName: '',
  prevTab: tabs.main,
  loading: false
};

export const mainSlice = createSlice({
  name: 'main',
  initialState,
  reducers: {
    initModule: (state, action) => {
      state.isInit = true;
      action.payload.canvas.width = playerConsts.canvasWidth;
      action.payload.canvas.height = playerConsts.canvasHeight;

      state.canvas = action.payload.canvas;
      if (!state.player) {
        state.player = new Player(action.payload.canvas);
        state.stickerName = 'Default name';
        state.player.name = state.stickerName;
      } else {
        state.player.canvas = action.payload.canvas;
        state.isPaused = true;
        state.player.goTo(state.player.videoTiming);
      }

      if (action.payload.onProgressChange) {
        state.player.addListener(throttle(action.payload.onProgressChange, 200));
      }
    },
    updateEndVideoTiming: (state, action) => {
      state.player.endVideoTiming = action.payload;
    },
    updateStickerName: (state, action) => {
      state.stickerName = action.payload;
      state.player.name = state.stickerName;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    changeTiming: (state, action) => {
      state.player.goTo(action.payload * state.player.endVideoTiming / 100);
      state.progress = action.payload;
    },
    toggleIsPaused: (state, action) => {
      state.isPaused = action.payload;

      if (action.payload) {
        state.player.stop();
      } else {
        state.player.play();
      }
    },
    togglePaused: (state, action) => {
      if (!state.isPaused) {
        state.player.stop();
        state.isPaused = true;
      } else {
        state.player.play();
        state.isPaused = false;
      }
    },
    openTab: (state, action) => {
      if (action.payload !== tabs.layer) {
        state.prevTab = state.tab;
      }
      state.tab = action.payload;
    },
    openPrevTab: (state, action) => {
      state.tab = state.prevTab;
    },
    download: (state, action) => {
      state.player.download(action.payload);
    },
    addLayer: (state, action) => {
      if (action.payload.layerName === emptyLayerName || !action.payload.layerName) {
        action.payload.layerName = `${emptyLayerName} (${state.player.getLayers().length + 1})`
      }
      state.player.addLayer(action.payload);
      state.layers = [...state.player.getLayers().map((layer) => layer.getResolvedLayer())];
    },
    deleteLayer: (state, action) => {
      state.player.deleteLayer(action.payload);
      state.layers = [...state.player.getLayers().map((layer) => layer.getResolvedLayer())];
    },
    moveLayerToNewOrder: (state, action) => {
      const newLayers = state.player.moveLayerToNewOrder(action.payload.layerOrder, action.payload.newLayerOrder);
      state.layers = newLayers.map((layer) => layer.getResolvedLayer());
    },
    resetMain: (state) => {
      if (state.player) {
        state.player.stop();
        state.isInit = false;
      }
    },
    resetWorkspace: (state) => {
      if (state.player) {
        state.player.destroy();
      }

      return initialState;
    },
  },
})

export const { openTab, togglePaused, openPrevTab, updateEndVideoTiming, resetWorkspace, updateStickerName, moveLayerToNewOrder, resetMain, deleteLayer, addLayer, toggleIsPaused, setProgress, download, changeTiming, initModule } = mainSlice.actions

export default mainSlice.reducer