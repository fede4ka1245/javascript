import {BrowserRouter, Route, Routes} from "react-router-dom";
import Main from "./pages/main/Main";
import {routes} from "./routes";
import {UserFeedback} from "./modules/alerts";
import {Grid} from "@mui/material";
import Header from "./ui/header/Header";
import Clips from "./pages/clips/Clips";

function App() {
  return (
    <>
      <UserFeedback />
      <BrowserRouter>
        <Header />
        <Grid
          width={'800px'}
          maxWidth={'100%'}
          ml={'auto'}
          mr={'auto'}
          p={'var(--space-md)'}
          overflow={'scroll'}
          height={'100%'}
        >
          <Routes>
            <Route path={routes.clips + '/:id'} element={<Clips />}/>
            <Route path={routes.main} element={<Main />}/>
            {/*<Route path={routes.savedStickers} element={<SavedStickers />}/>*/}
          </Routes>
        </Grid>
      </BrowserRouter>
    </>
  );
}

export default App;
