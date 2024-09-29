import React, {useCallback, useEffect} from 'react';
import {CardActionArea, Grid, Typography} from "@mui/material";
import {useDispatch} from "react-redux";
import {
  openTab,
} from "../../store/slices/main";
import {tabs} from "../../consts/tabs";
import {
  setLayerProps, setLayerType,
} from "../../store/slices/layer";
import {
  layerType
} from "../../consts/layerConsts";
import FileUploader from "../../../../ui/fileUploaderSmall/FileUploader";
import {
  TextSnippetRounded,
} from "@mui/icons-material";

const retentionVideos = [
  {
    url: '/retentions/1.mp4',
    text: 'Subway Surf'
  },
  {
    url: '/retentions/2.mp4',
    text: 'Need For Speed'
  }
]

const LayerEditor = () => {
  const dispatch = useDispatch();

  const onMediaAdd = useCallback(async (file) => {
    const URL = window.URL || window.webkitURL;
    // const file = event.target.files[0];

    if (!file) {
      return;
    }
    //
    // if (file.size / 1024 / 1024 >= 10) {
    //   await appAlert('The file is to large');
    //   return;
    // }

    return URL.createObjectURL(file);
  }, []);

  const onTextLayerAdd = useCallback(async () => {
    dispatch(setLayerType(layerType.text))
    dispatch(openTab(tabs.layer));
  }, []);

  const onAssetLayerAdd = useCallback(async (files) => {
    const file = files[0];

    if (file.type.includes('video')) {
      dispatch(setLayerProps({ src: await onMediaAdd(file) }))
      dispatch(setLayerType(layerType.video))
      dispatch(openTab(tabs.layer));
    } else if (file.type.includes('image')) {
      dispatch(setLayerProps({ src: await onMediaAdd(file) }))
      dispatch(setLayerType(layerType.image))
      dispatch(openTab(tabs.layer));
    }
  }, []);

  const onVideoClick = (src) => {
    dispatch(setLayerProps({ src }))
    dispatch(setLayerType(layerType.video))
    dispatch(openTab(tabs.layer));
  }

  return (
    <Grid display={'flex'} flexDirection={'column'} height={'100%'} >
      <Typography style={{ color: 'white', fontSize: '20px', lineHeight: '18px' }}>
        Ретеншн ассеты
      </Typography>
      <Grid display={ 'flex' } mt={2} gap={ 2 }>
        {retentionVideos.map(( clip ) => (
          <Grid display={'flex'} flexDirection={'column'} style={{ cursor: 'pointer' }}>
            <video
              onClick={() => onVideoClick(clip.url)}
              id={ clip.url }
              style={{ width: '180px', cursor: 'pointer', height: '210px', borderRadius: '16px', background: 'var(--primary-color)' }}
            >
              <source
                src={ clip.url }
              />
            </video>
            <Typography style={{ color: 'white', fontSize: '11px', lineHeight: '18px' }}>
              { clip.text }
            </Typography>
          </Grid>
        ))}
      </Grid>
      <Grid display={'flex'} flexDirection={'column'} mt={'auto'}>
        <Grid pb={1}>
          <FileUploader onChange={ onAssetLayerAdd } />
        </Grid>
        <Grid style={{ margin: '0 -8px -8px -8px' }} overflow={'hidden'} backgroundColor={'var(--primary-color)'} height={'80px'} display={'flex'} justifyContent={'center'} alignItems={'center'} textAlign={ 'center' }>
          <CardActionArea style={{ width: '100%', height: '100%', display: 'flex', gap: '8px' }} onClick={ onTextLayerAdd }>
            <TextSnippetRounded size={32} style={{ color: 'white', width: '28px', height: '28px' }} />
            <Grid color={'white'} fontSize={'24px'}>
              Добавь текстовый слой
            </Grid>
          </CardActionArea>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default LayerEditor;