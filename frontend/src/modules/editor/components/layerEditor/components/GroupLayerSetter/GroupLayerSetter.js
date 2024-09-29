import React, {useCallback, useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {Grid} from "@mui/material";
import Tabs from "../../../../../../ui/tabs/Tabs";
import Tab from "../../../../../../ui/tab/Tab";
import TextSetter from "./textSetter/TextSetter";
import TransformSetter from "./transformSetter/TransformSetter";
import TimingSetter from "./timingSetter/TimingSetter";
import {useDispatch, useSelector} from "react-redux";
import {initLayer, resetLayer, setLayerPlayerProgress, updateProperties} from "../../../../store/slices/layer";
import TextStylingSetter from "./textStylingSetter/TextStylingSetter";
import ImageSetter from "./imageSetter/ImageSetter";
import ImageLayer from "../../../../shared/editor/ImageLayer";
import TextLayer from "../../../../shared/editor/TextLayer";
import VideoSetter from "./videoSetter/VideoSetter";
import VideoLayer from "../../../../shared/editor/VideoLayer";
import {addLayer} from "../../../../store/slices/main";
import {
  blankImageSetter,
  blankTextSetter,
  blankTimingSetter,
  blankTransformSetter,
  blankVideoSetter,
  layerType
} from "../../../../consts/layerConsts";
import {v4 as uuidv4} from "uuid";

const tabs = {
  video: {
    label: 'Видео',
    value: 'video'
  },
  image: {
    label: 'Картинка',
    value: 'image'
  },
  text: {
    label: 'Текст',
    value: 'text',
  },
  textStyling: {
    label: 'Text styling',
    value: 'textStyling',
  },
  transform: {
    label: 'Параметры',
    value: 'transform'
  },
  timing: {
    label: 'Тайминг',
    value: 'timing'
  },
};

const GroupLayerSetter = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState();
  const [tab, setTab] = useState();
  const { layer, type, layerProps } = useSelector((state) => state.layer);
  const { canvas } = useSelector((state) => state.main);

  const activeTabs = useMemo(() => {
    if (layer instanceof TextLayer) {
      return [tabs.text, tabs.timing];
    } else if (layer instanceof ImageLayer) {
      return [tabs.image, tabs.timing];
    } else if (layer instanceof VideoLayer) {
      return [tabs.video, tabs.timing];
    }

    return [];
  }, [layer]);

  const onTabChange = useCallback((_, newTab) => {
    setTab(tabs[newTab]);
  }, []);

  const updateState = useCallback((state) => {
    dispatch(updateProperties(state));
    dispatch(addLayer(layer));
    setState(state);
  }, [ layer, state ]);

  const onTextPropsChange = useCallback((textProps) => {
    updateState({
      ...state,
      textProps
    })
  }, [state]);

  const onTimingPropsChange = useCallback((timingProps) => {
    updateState({
      ...state,
      timingProps
    })
  }, [state]);

  const onTransformPropsChange = useCallback((transformProps) => {
    updateState({
      ...state,
      transformProps
    })
  }, [state]);

  const onVideoPropsChange = useCallback((videoProps) => {
    updateState({
      ...state,
      videoProps
    })
  }, [state]);

  const onImagePropsChange = useCallback((imageProps) => {
    updateState({
      ...state,
      imageProps
    })
  }, [state]);

  useLayoutEffect(() => {
    if (layer) {
      updateState(layer.getResolvedLayer());

      if (layer instanceof TextLayer) {
        setTab(tabs.text);
      } else if (layer instanceof ImageLayer) {
        setTab(tabs.image);
      } else if (layer instanceof VideoLayer) {
        setTab(tabs.video);
      }
    }
  }, [layer]);

  const onTouchMove = useCallback((event) => {
    event.stopPropagation();
  }, []);

  const initLayerModule = useCallback(() => {
    if (!canvas) return;

    let newLayer = layer;

    if (!layer) {
      if (type === layerType.text) {
        newLayer = new TextLayer({
          textProps: blankTextSetter,
          timingProps: blankTimingSetter,
          transformProps: blankTransformSetter
        });
      } else if (type === layerType.video) {
        newLayer = new VideoLayer({
          videoProps: blankVideoSetter,
          timingProps: blankTimingSetter,
          transformProps: blankTransformSetter
        });
        if (layerProps) {
          newLayer.props.videoProps.src = layerProps.src;
        }
      } else {
        newLayer = new ImageLayer({
          imageProps: blankImageSetter,
          timingProps: blankTimingSetter,
          transformProps: blankTransformSetter
        });
        if (layerProps) {
          newLayer.props.imageProps.src = layerProps.src;
        }
      }
    }

    dispatch(initLayer({
      canvas,
      onProgressChange: ({ videoTiming, endVideoTiming }) => {
        dispatch(setLayerPlayerProgress(videoTiming / endVideoTiming * 100))
      },
      layer: newLayer
    }));
  }, [ canvas ]);

  useEffect(() => {
    initLayerModule();
  }, []);

  useEffect(() => {
    return () => {
      dispatch(resetLayer());
    };
  }, []);

  return (
    <>
      {/*<Grid*/}
      {/*  width={'100%'}*/}
      {/*  borderBottom={'var(--element-border)'}*/}
      {/*  backgroundColor={'var(--bg-color)'}*/}
      {/*>*/}
      {/*  <Tabs*/}
      {/*    value={tab?.value}*/}
      {/*    onChange={onTabChange}*/}
      {/*    aria-label="sticker-editor-tabs"*/}
      {/*    variant="fullWidth"*/}
      {/*    scrollButtons*/}
      {/*    allowScrollButtonsMobile*/}
      {/*  >*/}
      {/*    {activeTabs.map(({ label, value }) => (*/}
      {/*      <Tab key={value} label={label} value={value} />*/}
      {/*    ))}*/}
      {/*  </Tabs>*/}
      {/*</Grid>*/}
      <Grid
        backgroundColor={'var(--bg-color)'}
        onTouchMove={onTouchMove}
        height={'100%'}
        sx={{ overflowY: 'scroll' }}
        p={'calc(var(--space-sm) * 2)'}
      >
        {state && tab && <Grid>
          {tab.value === tabs.text.value && (
            <TextSetter
              textSetterState={state.textProps}
              setTextSetterState={onTextPropsChange}
            />
          )}
          {tab.value === tabs.timing.value && (
            <TimingSetter
              timingState={state.timingProps}
              setTimingState={onTimingPropsChange}
            />
          )}
          {tab.value === tabs.textStyling.value && (
            <TextStylingSetter
              textSetterState={state.textProps}
              setTextSetterState={onTextPropsChange}
            />
          )}
          {tab.value === tabs.video.value && (
            <VideoSetter
              videoSetterState={state.videoProps}
              setVideoSetterState={onVideoPropsChange}
            />
          )}
          {tab.value === tabs.image.value && (
            <ImageSetter
              imageSetterState={state.imageProps}
              setImageSetterState={onImagePropsChange}
            />
          )}
        </Grid>}
      </Grid>
    </>
  );
};

export default GroupLayerSetter;