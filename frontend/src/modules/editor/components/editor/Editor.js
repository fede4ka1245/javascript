import React, {useEffect} from 'react';
import {Grid} from "@mui/material";
import Main from "../main/Main";
import {useDispatch} from "react-redux";
import {addLayer, openTab} from "../../store/slices/main";
import VideoLayer from "../../shared/editor/VideoLayer";
import {setLayerProps, setLayerType} from "../../store/slices/layer";
import {layerType} from "../../consts/layerConsts";
import {tabs} from "../../consts/tabs";

const Editor = ({ videoLayerProps, close }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!videoLayerProps) {
      return;
    }

    console.log(videoLayerProps);

    setTimeout(() => {
      dispatch(setLayerProps({ src: videoLayerProps.videoProps.src }))
      dispatch(setLayerType(layerType.video))
      dispatch(openTab(tabs.layer));
    }, 200);
  }, []);

  return (
    <Grid display={'flex'} flexDirection={'column'} height={'100vh'}>
      <Main close={ close } />
    </Grid>
  );
};

export default Editor;