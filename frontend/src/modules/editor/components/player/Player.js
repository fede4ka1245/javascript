import React, {useEffect} from 'react';
import {Grid} from "@mui/material";
import styles from "./Player.module.css";
import PlayerSlider from "../../../../components/playerSlider/PlayerSlider";
import classNames from "classnames";

const Player = ({ init, progress, isPaused, setIsPaused, onProgressChange, isSmall }) => {
  useEffect(() => {
    const canvas = document.getElementById('playerCanvas');
    const canvasWrapper = document.getElementById('canvasWrapper');

    const observer = new ResizeObserver(() => {
      const { width, height, x, y } = canvas.getBoundingClientRect();
      canvasWrapper.style.position = 'fixed';
      canvasWrapper.style.left = x + 'px';
      canvasWrapper.style.top = y + 'px';
      canvasWrapper.style.width = width + 'px';
      canvasWrapper.style.height = height + 'px';
    });

    observer.observe(canvas);
    observer.observe(window.document.body);

    return () => {
      observer.disconnect();
    }
  }, []);

  return (
    <>
      <Grid
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'}
        borderTop={'var(--element-border)'}
        borderBottom={'var(--element-border)'}
        position={'relative'}
        height={'100%'}
      >
        <canvas
          ref={init}
          id={'playerCanvas'}
          className={classNames(styles.canvas, { [styles.smallCanvas]: isSmall })}
        />
        <div id={'canvasWrapper'} style={{ overflow: 'hidden' }}>
        </div>
        <Grid
          position={'absolute'}
          width={'100%'}
          pl={'var(--space-sm)'}
          pr={'var(--space-sm)'}
          bottom={'0'}
        >
          <PlayerSlider
            progress={progress}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            setProgress={onProgressChange}
            size="small"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Player;