import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { isAuthenticated, login, logout } from './auth';

const UNLOCK_DELAY = 2000;

const AuthContext = createContext(null);

const authScreenSx = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  px: { xs: 2, sm: 3 },
  py: 4,
  background: 'linear-gradient(180deg, #f4f7fb 0%, #eef7f5 100%)',
};

const authPanelSx = {
  width: 'min(100%, 420px)',
  borderRadius: '18px',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  boxShadow: '0 24px 80px rgba(15, 23, 42, 0.14)',
  p: { xs: 3, sm: 4 },
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthGate');
  }

  return context;
}

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);


  useEffect(() => {
    if (!unlocking) return undefined;

    const startedAt = Date.now();
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setUnlockProgress(Math.min((elapsed / UNLOCK_DELAY) * 100, 100));
    }, 50);

    const unlockTimeout = window.setTimeout(() => {
      setUnlockProgress(100);
      setAuthed(true);
      setUnlocking(false);
    }, UNLOCK_DELAY);

    return () => {
      window.clearInterval(progressInterval);
      window.clearTimeout(unlockTimeout);
    };
  }, [unlocking]);

  async function handleLogin() {
    if (loading || unlocking) return;

    if (!input.trim()) {
      setErrorMessage('Enter your passphrase to continue.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const success = await login(input);

      if (success) {
        setInput('');
        setUnlockProgress(0);
        setUnlocking(true);
        return;
      }

      setErrorMessage('Incorrect passphrase. Try again.');
    } catch {
      setErrorMessage('Unable to verify passphrase. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = useCallback(() => {
    logout();
    setAuthed(false);
  }, []);

  const authContextValue = useMemo(
    () => ({ onLogout: handleLogout }),
    [handleLogout],
  );

  if (authed) {
    const content = typeof children === 'function'
      ? children(authContextValue)
      : children;

    return (
      <AuthContext.Provider value={authContextValue}>
        {content}
      </AuthContext.Provider>
    );
  }

  if (unlocking) {
    return <UnlockOverlay progress={unlockProgress} />;
  }

  return (
    <Box sx={authScreenSx}>
      <Paper elevation={0} sx={authPanelSx}>
        <Stack spacing={3}>
          <Stack spacing={1.25} alignItems="center" textAlign="center">
            <Box>
              <Typography variant="h5" fontWeight={800} color="#4a6555">
                Tinables
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure access
              </Typography>
            </Box>
          </Stack>

          <Box
            component="form"
            noValidate
            onSubmit={event => {
              event.preventDefault();
              handleLogin();
            }}
          >
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                autoFocus
                label="Passphrase"
                type="password"
                value={input}
                error={Boolean(errorMessage)}
                helperText={errorMessage || ' '}
                disabled={loading}
                onChange={event => {
                  setInput(event.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon color={errorMessage ? 'error' : "#4a6555"} />
                      </InputAdornment>
                    ),
                  },
                  formHelperText: {
                    sx: {
                      ml: 0,
                      mt: 1,
                      fontWeight: 700,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={
                  loading ? <CircularProgress size={18} color="inherit" /> : null
                }
                sx={{
                  minHeight: 48,
                  borderRadius: '14px',
                  fontWeight: 800,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                  backgroundColor: '#4a6555',
                  color: 'white',
                }}
              >
                {loading ? 'Verifying...' : 'Unlock'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

function UnlockOverlay({ progress }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        ...authScreenSx,
        position: 'fixed',
        inset: 0,
        zIndex: theme => theme.zIndex.modal + 1,
      }}
    >
      <Paper elevation={0} sx={authPanelSx}>
        <Stack spacing={2.5} alignItems="stretch">
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Box
              component="img"
              src="/logo.png"
              alt="Tinables"
              sx={{ width: 64, height: 64, display: 'block' }}
            />
            <Typography variant="h6" color="#4a6555">
              Unlocking Tinables
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: '999px',
              backgroundColor: 'rgba(15, 118, 110, 0.14)',
              '& .MuiLinearProgress-bar': {
                borderRadius: '999px',
              },
            }}
          />
        </Stack>
      </Paper>
    </Box>
  );
}
