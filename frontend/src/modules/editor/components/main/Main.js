import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {CardActionArea, Grid, IconButton, Typography} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {
  changeTiming,
  download,
  initModule, openPrevTab, openTab, resetMain,
  setProgress,
  toggleIsPaused, togglePaused, updateEndVideoTiming, updateStickerName
} from "../../store/slices/main";
import Player from "../player/Player";
import Input from "../../../../ui/input/Input";
import {appAlert, appConfirm} from "../../../alerts";
import AppLoader from "../../../../ui/appLoader/AppLoader";
import Layers from "../layers/Layers";
import {tabs} from "../../consts/tabs";
import {useNavigate} from "react-router-dom";
import {routes} from "../../../../routes";
import Tabs from "../../../../ui/tabs/Tabs";
import Tab from "../../../../ui/tab/Tab";
import {ArrowBack, CloseOutlined, FileDownloadRounded} from "@mui/icons-material";
import GroupLayerSetter from "../layerEditor/components/GroupLayerSetter/GroupLayerSetter";
import Assets from "../assets/Assets";
import Slider from "../../../../ui/slider/Slider";
import {playerConsts} from "../../consts/playerConsts";

const Main = ({ close }) => {
  const { progress, isPaused, player, layers, stickerName } = useSelector((state) => state.main);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { tab } = useSelector((state) => state.main);
  const pageTabs = useMemo(() => [tabs.main, tabs.assets, tabs.layers], []);

  const onTabChange = useCallback((event, newValue) => {
    dispatch(openTab(tabs[newValue]));
  }, []);

  const [ endVideoTiming, handleEndVideoTiming ] = useState({ target: { value: 50 }});
  const msVideoTiming = useMemo(() => {
    return Number.parseFloat(playerConsts.maxTiming * (endVideoTiming?.target?.value / 100)).toFixed(2)
  }, [ endVideoTiming ]);
  useEffect(() => {
    if (msVideoTiming) {
      dispatch(updateEndVideoTiming(msVideoTiming));
    }
  }, [ msVideoTiming ]);

  const onButtonCloseClick = useCallback(async () => {
    if (await appConfirm("Закрывая редакторы вы теряете прогресс")) {
      player.terminate();
      close();
    }
  }, [player]);

  const onButtonBackClick = useCallback(async () => {
    dispatch(openPrevTab());
  }, []);

  const initStickerEditor = useCallback((canvas) => {
    if (!canvas) return;

    dispatch(initModule({
      canvas,
      onProgressChange: ({ videoTiming, endVideoTiming }) => {
        dispatch(setProgress(videoTiming / endVideoTiming * 100))
      }
    }));
  }, []);

  const onProgressChange = useCallback((progress) => {
    dispatch(changeTiming(progress));
  }, []);

  const setIsPaused = useCallback((isPaused) => {
    dispatch(toggleIsPaused(isPaused));
  }, []);

  const onUpdateStickerName = useCallback((event) => {
    dispatch(updateStickerName(event.target.value));
  }, []);

  const onDownload = useCallback(async () => {
    setLoading(true);
    dispatch(download(() => { setLoading(false); }));
  }, []);

  useEffect(() => {
    return () => {
      dispatch(resetMain());
    };
  }, []);

  const onKeydown = (e) => {
    if (e.code === 'Space') {
      dispatch(togglePaused());
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('keydown', onKeydown);
    };
  }, []);

  return (
    <>
      <AppLoader loading={loading} />
      <Grid display={ 'flex' }>
        <Grid style={{ background: 'black' }} flex={ 1 } display={'flex'} flexDirection={ 'column' } overflow={ 'hidden' }>
          <Grid height={ 'calc(100vh - 8px)' }>
            <Player
              init={initStickerEditor}
              progress={progress}
              isPaused={isPaused}
              onProgressChange={onProgressChange}
              setIsPaused={setIsPaused}
            />
          </Grid>
          {/*<Grid height={ layersHeight + 'px' }>*/}
          {/*  <Grid display={'flex'} height={ '100%' } style={ { overflowY: 'scroll' } }>*/}
          {/*    <Layers />*/}
          {/*  </Grid>*/}
          {/*</Grid>*/}
        </Grid>
        {tab === tabs.layer && <Grid width={ 400 } height={ '100vh' } backgroundColor={'var(--bg-color)'} borderLeft={'var(--element-border)'} borderTop={'var(--element-border)'} borderBottom={'var(--element-border)'} display={'flex'} flexDirection={'column'}>
          <Grid px={1} py={1} display={'flex'} gap={1} alignItems={'center'} borderBottom={'var(--element-border)'}>
            <IconButton onClick={ onButtonBackClick }>
              <ArrowBack style={{ color: 'white' }}/>
            </IconButton>
            <Typography style={{ color: 'white', fontSize: '20px', lineHeight: '18px' }}>
              Редактировать слой
            </Typography>
          </Grid>
          <Grid flex={1} style={{ overflowY: 'scroll' }} >
            <GroupLayerSetter />
          </Grid>
        </Grid>}
        {tab !== tabs.layer && <Grid width={ 400 } height={ '100vh' } backgroundColor={'var(--bg-color)'} borderLeft={'var(--element-border)'} borderTop={'var(--element-border)'} borderBottom={'var(--element-border)'} display={'flex'} flexDirection={'column'}>
          <Grid px={1} py={1} display={'flex'} gap={1} alignItems={'center'} borderBottom={'var(--element-border)'}>
            <IconButton onClick={ onButtonCloseClick }>
              <CloseOutlined style={{ color: 'white' }}/>
            </IconButton>
            <Typography style={{ color: 'white', fontSize: '20px', lineHeight: '18px' }}>
              Редактор
            </Typography>
          </Grid>
          <Grid borderBottom={'var(--element-border)'}>
            <Tabs
              value={tab.value}
              onChange={onTabChange}
              aria-label="sticker-editor-tabs"
              variant="fullWidth"
              scrollButtons={'false'}
              allowScrollButtonsMobile
            >
              {pageTabs.map(({ label, value }) => (
                <Tab key={value} label={label} value={value} />
              ))}
            </Tabs>
          </Grid>
          {tab === tabs.main && <>
            <Grid flex={1} pt={1}>
              <Grid p={'var(--space-sm)'} height={'100%'} display={'flex'} flexDirection={'column'}>
                <Grid mb={'auto'}>
                  <Grid>
                    <Grid display={'flex'} justifyContent={'space-between'} mb={1}>
                      <Typography style={{ color: 'white', fontSize: '20px', lineHeight: '18px' }}>
                        Длина видео
                      </Typography>
                      <Typography style={{ color: 'var(--hint-color)', fontSize: '20px', lineHeight: '18px' }}>
                        {(msVideoTiming / 1000).toFixed()} секунд
                      </Typography>
                    </Grid>
                    <Slider
                      size={'small'}
                      value={endVideoTiming?.target?.value}
                      defaultValue={0}
                      onChange={handleEndVideoTiming}
                    />
                  </Grid>
                </Grid>
                <Grid style={{ margin: '0 -8px -8px -8px' }} overflow={'hidden'} backgroundColor={'var(--primary-color)'} height={'80px'} display={'flex'} justifyContent={'center'} alignItems={'center'} textAlign={ 'center' }>
                  <CardActionArea style={{ width: '100%', height: '100%', display: 'flex', gap: '8px' }} onClick={ onDownload }>
                    <FileDownloadRounded size={32} style={{ color: 'white', width: '28px', height: '28px' }} />
                    <Grid color={'white'} fontSize={'24px'}>
                      Сохранить
                    </Grid>
                  </CardActionArea>
                </Grid>
              </Grid>
            </Grid>
          </>}
          {tab === tabs.assets && <>
            <Grid flex={1} pt={1}>
              <Grid p={'var(--space-sm)'} height={'100%'} display={'flex'} flexDirection={'column'}>
                <Assets />
              </Grid>
            </Grid>
          </>}
          {tab === tabs.layers && <>
            <Grid flex={1} overflow={'scroll'}>
              <Grid display={'flex'} flexDirection={'column'} gap={1}>
                <Layers />
              </Grid>
            </Grid>
          </>}
        </Grid>}
      </Grid>
    </>
  );
};

export default Main;