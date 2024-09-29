import React, {useEffect, useId, useState} from 'react';
import {useNavigate, useParams} from "react-router-dom";
import {getShorts, getStorageUrl, getUpload} from "../../api";
import {Grid, Typography} from "@mui/material";
import { Editor } from "../../modules/editor";

const Clip = ({ clip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const videoId = useId();

  return (
    <>
      <Grid onClick={ () => setIsOpen(true) } className={'clip'} width="100%" minHeight="400" height="400" display={'flex'} p={2} gap={2}>
        <video
          id={ videoId }
          style={{ width: '190px', height: '340px', borderRadius: '16px' }}
        >
          <source
            src={ clip.url }
          />
        </video>
        <Grid p={2} borderRadius='16px' display={'flex'} flexDirection={'column'} flex={1} style={{ background: "var(--bg-color)" }}>
          <Typography fontWeight={'bold'} fontSize={'30'} color={'white'}>
            { clip.header }
          </Typography>
          <Typography color={'white'} mt='auto'>
            Интерпритации: { clip.ints.join(', ') }
          </Typography>
          <Typography color={'white'} mt={1}>
            Статус: { clip.state }
          </Typography>
        </Grid>
      </Grid>
      <Editor isOpen={ isOpen } close={ () => setIsOpen(false) } src={ clip.url } />
    </>
  )
}

const Clips = () => {
  const { id } = useParams();
  const [clips, setClips] = useState([
    {
      header: 'Про очереди',
      ints: ['Обнаружено лицо', 'Громкий звук'],
      state: 'Завершено',
      url: '/mocks/1.mp4'
    },
    {
      header: 'Ушел поздно',
      ints: ['Обнаружено лицо', 'Громкий звук'],
      state: 'Завершено',
      url: '/mocks/2.mp4'
    },
    {
      header: 'Ушел поздно',
      ints: ['Обнаружено лицо', 'Громкий звук'],
      state: 'Завершено',
      url: '/mocks/3.mp4'
    },
    {
      header: 'Первая не заходит',
      ints: ['Обнаружено лицо', 'Громкий звук'],
      state: 'Завершено',
      url: '/mocks/4.mp4'
    }
  ])
  const [state, setState] = useState({});
  const navigate = useNavigate();

  // useEffect(() => {
  //   getShorts(id)
  //     .then((res) => {
  //       console.log(res);
  //       setClips(res);
  //     });
  //
  //   getUpload(id)
  //     .then((res) => {
  //       setState(res);
  //     })
  // }, []);

  return (
    <Grid>
      <Grid display="flex" flexDirection="column" gap={2}>
        { clips.map((clip) => (
          <Grid key={ clip.id }>
            <Clip clip={clip} />
          </Grid>
        )) }
      </Grid>
    </Grid>
  );
};

export default Clips;