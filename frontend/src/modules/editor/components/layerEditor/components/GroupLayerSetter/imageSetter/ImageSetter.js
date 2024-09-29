import React, {useCallback} from 'react';
import {Grid, Typography} from "@mui/material";

const ImageSetter = ({ imageSetterState, setImageSetterState }) => {
  const onImageChange = useCallback((event) => {
    const URL = window.URL || window.webkitURL;
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setImageSetterState({
      ...imageSetterState,
      src: URL.createObjectURL(file)
    });
  }, [imageSetterState]);

  return (
    <>
      <Grid mb={'var(--space-md)'}>
      </Grid>
    </>
  );
};

export default ImageSetter;