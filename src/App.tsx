import { Container, Stack,  Button, Typography, CssBaseline, IconButton, ButtonPropsColorOverrides, } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import MinimizeIcon from '@mui/icons-material/Minimize';
import NumberField from "./components/NumberFields";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { OverridableStringUnion } from "@mui/types";


type TimerStatus = "Idle" | "Running" | "Paused";

type ButtonColorType = OverridableStringUnion<'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning', ButtonPropsColorOverrides>;

function App() {
  const [minute, setMinute] = useState<number>(1);
  const [leaveSec, setLeaveSec] = useState<number>(0);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('Idle');

  const startTimer = async () => {
    await invoke("start_timer", {
      minutes: minute,
      notifyMinutes: [],
    });
  };
  const pauseTimer = () => {
    invoke("pause_timer");
  }
  const resumeTimer = () => {
    invoke("resume_timer");
  }

  const buttonProps = {
    Idle: {
      color: 'primary',
      startIcon: <PlayArrowIcon/>,
      label: '開始',
      onClick: () => {
        startTimer();
      },
    },
    Running: {
      color: 'secondary',
      startIcon: <PauseIcon/>,
      label: '停止',
      onClick: () => {
        pauseTimer();
      },
    },
    Paused: {
      color: 'primary',
      startIcon: <PlayArrowIcon/>,
      label: '再開',
      onClick: () => {
        resumeTimer();
      },
    },
  };

  useEffect(() => {
    const timerTieckListener = listen<number>("timer_tick", (event) => {
      setLeaveSec(event.payload);
    });
    const timerStatusListener = listen<TimerStatus>("timer_status", (event) => {
      setTimerStatus(event.payload);
    });

    return () => {
      timerTieckListener.then((unlisten) => unlisten());
      timerStatusListener.then((unlisten) => unlisten());
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
      <Container maxWidth="md" sx={{padding: '0px'}}>
        <Stack spacing={2} padding={2}>
          <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
            <Stack direction={'row'} spacing={1} alignItems={'center'}>
              <Button
                variant="contained"
                color={buttonProps[timerStatus].color as ButtonColorType}
                startIcon={buttonProps[timerStatus].startIcon}
                onClick={buttonProps[timerStatus].onClick}
              >
                {buttonProps[timerStatus].label}
              </Button>
              <Button
                disabled={timerStatus === 'Idle'}
                variant="contained"
                color="error"
                startIcon={<StopIcon/>}
                onClick={() => {invoke('stop_timer')}}
              >
                停止
              </Button>
            </Stack>
            <Typography>
              残り&nbsp;
              {String(Math.floor(leaveSec / 60)).padStart(2, '0')}&nbsp;分
              &nbsp;
              {String(leaveSec % 60).padStart(2, '0')}&nbsp;秒
            </Typography>
          </Stack>
          <NumberField
            disabled={timerStatus !== 'Idle'}
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
