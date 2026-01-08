import { Container, Stack,  Button, Typography, CssBaseline, IconButton, ButtonPropsColorOverrides, Tooltip, } from "@mui/material";
import PlayIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import MinimizeIcon from '@mui/icons-material/Minimize';
import NumberField from "./components/NumberFields";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from '@tauri-apps/api/window';

type TimerStatus = "Idle" | "Running" | "Paused";

const useTimer = () => {
  const [leaveSec, setLeaveSec] = useState<number>(0);
  const [status, setStatus] = useState<TimerStatus>('Idle');
  const start = async (minutes: number, notifyMinutes: number[]) => {
    await invoke("start_timer", {
      minutes,
      notifyMinutes,
    });
  };
  const pause = () => invoke("pause_timer");
  const resume = () => invoke("resume_timer");
  const stop = () => invoke("stop_timer");

  useEffect(() => {
    const timerTieckListener = listen<number>("timer_tick", (event) => {
      setLeaveSec(event.payload);
    });
    const timerStatusListener = listen<TimerStatus>("timer_status", (event) => {
      setStatus(event.payload);
    });

    return () => {
      timerTieckListener.then((unlisten) => unlisten());
      timerStatusListener.then((unlisten) => unlisten());
    };
  }, []);

  return {
    leaveSec,
    status,
    start,
    pause,
    resume,
    stop
  }
}

function App() {
  const [minute, setMinute] = useState<number>(1);

  const timer = useTimer();

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
              <Tooltip title={"開始・再開"} placement={'top'}>
                <Button
                  disabled={timer.status === 'Running'}
                  variant="contained"
                  color={'primary'}
                  onClick={() => {
                    if (timer.status === 'Idle') {
                      timer.start(minute, []);
                    } else if (timer.status === 'Paused') {
                      timer.resume();
                    }
                  }}
                >
                  <PlayIcon/>
                </Button>
              </Tooltip>
              <Tooltip title="一時停止" placement={'top'}>
                <Button
                  disabled={timer.status !== 'Running'}
                  variant="contained"
                  color={'secondary'}
                  onClick={() => timer.pause()}
                >
                  <PauseIcon/>
                </Button>
              </Tooltip>
              <Tooltip title="停止" placement={'top'}>
                <Button
                  disabled={timer.status === 'Idle'}
                  variant="contained"
                  color="error"
                  onClick={() => timer.stop()}
                >
                  <StopIcon/>
                </Button>
              </Tooltip>
            </Stack>
            <Typography>
              残り&nbsp;
              {String(Math.floor(timer.leaveSec / 60)).padStart(2, '0')}&nbsp;分
              &nbsp;
              {String(timer.leaveSec % 60).padStart(2, '0')}&nbsp;秒
            </Typography>
          </Stack>
          <NumberField
            disabled={timer.status !== 'Idle'}
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
