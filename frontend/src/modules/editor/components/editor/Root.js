import React from 'react';
import {Provider} from "react-redux";
import Editor from "./Editor";
import store from "../../store";
import {Grid} from "@mui/material";

const Root = ({ isOpen, src, close }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Grid left={0} top={0} position={'fixed'} width={'100vw'} height={'100vh'} zIndex={100}>
      <Provider store={store}>
        <Editor close={ close } videoLayerProps={{ videoProps: { src }, transformProps: {}, position: { x: 0, y: 0, width: 190, height: 340 } }} />
      </Provider>
    </Grid>
  );
};

export default Root;