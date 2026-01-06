import { Container, Stack,  Button, Typography, Box, CssBaseline, IconButton, } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import NumberField from "./components/NumberFields";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from '@tauri-apps/api/window';

function App() {
  const [minute, setMinute] = useState<number>(1);
  const [leaveSec, setLeaveSec] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const onStartTimer = () => {
    invoke("start_timer", {
      minutes: minute,
      notifyMinutes: [],
    }).then(() => {
      setIsStarted(true);
    });
  };
  useEffect(() => {
    const unlistenPromise = listen<number>("timer_tick", (event) => {
      setLeaveSec(event.payload);
      if (event.payload === 0) {
        setIsStarted(false);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const appWindow = getCurrentWindow();
  
  return (
    <Stack>
      <CssBaseline/>
      <Stack data-tauri-drag-region bgcolor={'primary.main'} color={'#FFF'} padding={1} direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
        <Typography fontSize={'12px'}>
          カウントダウンタイマー
        </Typography>
        <Stack direction={'row'} spacing={1} alignItems={'center'}>
          <IconButton size="small" sx={{padding:0}} onClick={() => {appWindow.minimize()}}>
            <MinimizeIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
          </IconButton>
          <IconButton size='small' sx={{padding: 0}} onClick={() => appWindow.hide()}>
            <CloseIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
          </IconButton>
        </Stack>
      </Stack>
      <Container maxWidth="md">
        <Stack spacing={2} padding={2}>
          <Stack direction={'row'} spacing={1} justifyContent={'space-between'} alignItems={'center'}>
            <Button variant="contained" startIcon={isStarted ? <ArrowRightIcon/> : <div/>} onClick={onStartTimer} disabled={isStarted}>
              {isStarted ? 'カウントダウン中' : 'スタート'}
            </Button>
            <Typography>
              残り&nbsp;
              {String(Math.floor(leaveSec / 60)).padStart(2, '0')}&nbsp;分
              &nbsp;
              {String(leaveSec % 60).padStart(2, '0')}&nbsp;秒
            </Typography>
          </Stack>
          <NumberField
            disabled={isStarted}
            label="タイマー（分）"
            value={minute}
            max={300}
            min={1}
            onValueChange={(v) => {
              v && setMinute(v);
            }}
          />
          {/* <NumberField
            label="通知１"
            max={minute}
            min={1}
          />
          <NumberField
            label="通知２"
            max={minute}
            min={1}
          /> */}
        </Stack>
      </Container>
    </Stack>
  );
}

export default App;
