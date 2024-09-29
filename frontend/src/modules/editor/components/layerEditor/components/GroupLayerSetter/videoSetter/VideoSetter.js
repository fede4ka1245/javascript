import React, {useCallback} from 'react';
import {Grid, Typography} from "@mui/material";
import InputNumber from "../../../../../../../components/inputNumber/InputNumber";

const VideoSetter = ({ videoSetterState, setVideoSetterState }) => {
  const onVideoChange = useCallback(async (event) => {
    const URL = window.URL || window.webkitURL;
    const file = event.target.files[0];

    if (!file) {
      return;
    }
    //
    // if (file.size / 1024 / 1024 >= 10) {
    //   await appAlert('The file is to large');
    //   return;
    // }

    setVideoSetterState({
      ...videoSetterState,
      src: URL.createObjectURL(file)
    });
  }, [videoSetterState]);

  const setTimingEnd = useCallback((value) => {
    setVideoSetterState({
      ...videoSetterState,
      timingEnd: value
    });
  }, [videoSetterState]);

  const setTimingStart = useCallback((value) => {
    setVideoSetterState({
      ...videoSetterState,
      timingStart: value
    });
  }, [videoSetterState]);

  return (
    <>
      <Grid mb={'var(--space-md)'}>
        <InputNumber
          min={0}
          step={5}
          max={videoSetterState.timingEnd}
          fullWidth
          value={videoSetterState.timingStart}
          onChange={setTimingStart}
          type={'outline'}
          label={'Video timing start (ms)'}
        />
      </Grid>
    </>
  );
};

export default VideoSetter;