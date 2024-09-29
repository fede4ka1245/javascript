import {useEffect} from "react";
import TextLayer from "../shared/editor/TextLayer";
import {addLayer, updateStickerName} from "../store/slices/main";
import {useDispatch, useSelector} from "react-redux";
import {useLocation} from "react-router-dom";
import VideoLayer from "../shared/editor/VideoLayer";
import ImageLayer from "../shared/editor/ImageLayer";
import {initLayer, setLayerPlayerProgress} from "../store/slices/layer";

export const useInitialLayers = () => {
  const { isInit, layers, player } = useSelector((state) => state.main);
  const { state } = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isInit && !layers?.length) {
      if (state) {
        player.id = state.id;
        state.layers.forEach((layer) => {
          console.log(layer);

          if (layer.imageProps) {
            dispatch(addLayer(new ImageLayer(layer)));
          } else if (layer.videoProps) {
            dispatch(addLayer(new VideoLayer(layer)));
          } else {
            dispatch(addLayer(new TextLayer(layer)));
          }
        });
        dispatch(updateStickerName(state.name));
        return;
      }
    }
  }, [isInit]);
}