import { Container, Stack,  Button, Typography, CssBaseline, IconButton, Tooltip, ThemeProvider, createTheme, Zoom, Box, Collapse} from "@mui/material";
import PlayIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import MinimizeIcon from '@mui/icons-material/Minimize';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
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

const TimerApp = () => {
  const [minutes, setMinutes] = useState<number>(1);
  const [notifyLeaveMinutes, setNotifyLeaveMinutes] = useState<(number|undefined)[]>([undefined, undefined]);
  const [notifyLeaveMinutesErros, setNotifyLeaveMinutesErros] = useState<(string | undefined)[]>([undefined, undefined]);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false);
  const [isSimpleBar, setIsSimpleBar] = useState<boolean>(false);

  const timer = useTimer();

  const appWindow = getCurrentWindow();

  const validateTimerSetting = () => {
    // タイマー設定が残り時間通知設定より値が小さくないか？
    const errors = notifyLeaveMinutes.map<string|undefined>(value => {
      if (value === undefined) return undefined;
      if (value <= minutes) return undefined;
      return 'タイマーの設定値よりも小さな値で設定してください';
    });

    setNotifyLeaveMinutesErros([...errors]);
    return errors.find((v) => v !== undefined) === undefined;
  };

  const resetErrorState = () => {
    setNotifyLeaveMinutesErros([undefined, undefined]);
  }
  
  return (
    <Stack sx={{borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.4)'}}>
      <Stack sx={{background: '#fff', borderRadius: '8px'}}>
        <Stack data-tauri-drag-region bgcolor={'primary.main'} color={'#FFF'} padding={1} direction={'row'} justifyContent={'space-between'} alignItems={'center'} borderRadius={'8px 8px 0 0'} >
          <Typography fontSize={'12px'}>
            カウントダウンタイマー
          </Typography>
          <Stack direction={'row'} spacing={1} alignItems={'center'}>
            <IconButton
              size="small"
              sx={{padding:0}}
              onClick={() => {
                setIsSimpleBar(!isSimpleBar);
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: '18px',
                  height: '18px',
                }}
              >
                <Zoom in={isSimpleBar}>
                  <Box sx={{ position: "absolute", inset: 0 }}>
                    <CloseFullscreenIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
                  </Box>
                </Zoom>

                <Zoom in={!isSimpleBar}>
                  <Box sx={{ position: "absolute", inset: 0 }}>
                    <OpenInFullIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
                  </Box>
                </Zoom>
              </Box>
            </IconButton>
            <IconButton
              size="small"
              sx={{padding:0}}
              onClick={() => {
                setIsAlwaysOnTop(!isAlwaysOnTop);
                appWindow.setAlwaysOnTop(!isAlwaysOnTop);
              }}
            >
              <PushPinIcon
                sx={{
                  width: '18px', height: '18px',
                  color: '#fff',
                  transform: isAlwaysOnTop ? 'rotate(0deg)' : 'rotate(-45deg)',
                  transition: "transform 0.2s ease",
                }}
              />
            </IconButton>
            <IconButton size="small" sx={{padding:0}} onClick={() => appWindow.minimize()}>
              <MinimizeIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
            </IconButton>
            <IconButton size='small' sx={{padding: 0}} onClick={() => appWindow.hide()}>
              <CloseIcon sx={{width: '18px', height: '18px', color: '#fff'}}/>
            </IconButton>
          </Stack>
        </Stack>
        <Container maxWidth="md" sx={{padding: '0px'}}>
          <Stack padding={2} spacing={1}>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
              <Stack direction={'row'} spacing={1} alignItems={'center'}>
                <Tooltip title={"開始・再開"} placement={'top'}>
                  <Button
                    disabled={timer.status === 'Running'}
                    variant="contained"
                    color={'primary'}
                    onClick={() => {
                      if (timer.status === 'Idle') {
                        if (validateTimerSetting()) {
                          resetErrorState();
                          timer.start(minutes, notifyLeaveMinutes.filter((v) => v !== undefined));
                        }
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
            <Collapse in={!isSimpleBar}>
              <Stack spacing={1}>
                <NumberField
                  disabled={timer.status !== 'Idle'}
                  label="タイマー（分）"
                  value={minutes}
                  max={300}
                  min={1}
                  size="small"
                  onValueChange={(v) => {
                    v && setMinutes(v);
                  }}
                />
                <NumberField
                  disabled={timer.status !== 'Idle'}
                  label="残り時間通知１"
                  max={minutes}
                  min={1}
                  size="small"
                  value={notifyLeaveMinutes[0]}
                  onValueChange={(v) => {
                    const newList = [...notifyLeaveMinutes];
                    newList[0] = v ?? undefined;
                    setNotifyLeaveMinutes(newList);
                  }}
                  helperText={notifyLeaveMinutesErros[0]}
                  error={notifyLeaveMinutesErros[0] !== undefined}
                />
                <NumberField
                  disabled={timer.status !== 'Idle'}
                  label="残り時間通知２"
                  max={minutes}
                  min={1}
                  size="small"
                  value={notifyLeaveMinutes[1]}
                  onValueChange={(v) => {
                    const newList = [...notifyLeaveMinutes];
                    newList[1] = v ?? undefined;
                    setNotifyLeaveMinutes(newList);
                  }}
                  helperText={notifyLeaveMinutesErros[1]}
                  error={notifyLeaveMinutesErros[1] !== undefined}
                />
              </Stack>
            </Collapse>
          </Stack>
        </Container>
      </Stack>
    </Stack>
  );
}


const App = () => {
  const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          backgroundColor: "transparent",
        },
        body: {
          backgroundColor: "transparent",
        },
        "#root": {
          backgroundColor: "transparent",
        }
      },
    },
  },
});
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <TimerApp/>
    </ThemeProvider>
  )
};

export default App;
