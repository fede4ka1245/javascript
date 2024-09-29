import React, {useCallback, useMemo, useState} from 'react';
import FileUploader from "../../ui/fileUploader/FileUploader";
import {useNavigate} from "react-router-dom";
import {routes} from "../../routes";
import AppLoader from "../../ui/appLoader/AppLoader";
import {Typography} from "@mui/material";
import {uploadFile} from "../../api";

const Main = () => {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      navigate(routes.clips + '/' + 10);
      setLoading(false);
    }, 6000);
  }, []);

  const onIdChange = useCallback((event) => {
    setId(event.target.value);
  }, [])

  const isIdDisabled = useMemo(() => {
    return isNaN(Number(id)) || id === '';
  }, [id]);

  const openSummary = useCallback(() => {
    navigate(routes.clips + '/' + id);
  }, [id]);

  return (
    <>
      <Typography
        fontWeight={'1000'}
        fontSize={'25px'}
        userSelect={'none'}
        fontFamily={'Nunito'}
        color={'white'}
        mb={'var(--space-md)'}
      >
        Загрузите файл
      </Typography>
      <FileUploader
        onChange={onChange}
      />
      <Typography
        fontWeight={'1000'}
        fontSize={'25px'}
        userSelect={'none'}
        fontFamily={'Nunito'}
        color={'white'}
        mb={'var(--space-md)'}
        mt={'var(--space-md)'}
      >
        Ваши загрузки
      </Typography>
      {/*{!summaries?.length && <Typography*/}
      {/*  fontWeight={'1000'}*/}
      {/*  fontSize={'25px'}*/}
      {/*  userSelect={'none'}*/}
      {/*  fontFamily={'Nunito'}*/}
      {/*  color={'var(--hint-color)'}*/}
      {/*  mb={'var(--space-md)'}*/}
      {/*>*/}
      {/*  Вы пока не загружали и не открывали клипы*/}
      {/*</Typography>}*/}
      {/*{summaries?.length !== 0 && <>*/}
      {/*  <Grid>*/}
      {/*    {summaries.map((id) => (*/}
      {/*      <Grid key={id} mb={'var(--space-sm)'}>*/}
      {/*        <SummaryItem*/}
      {/*          id={id}*/}
      {/*        />*/}
      {/*      </Grid>*/}
      {/*    ))}*/}
      {/*  </Grid>*/}
      {/*</>}*/}
      <AppLoader loading={loading} />
    </>
  );
};

export default Main;