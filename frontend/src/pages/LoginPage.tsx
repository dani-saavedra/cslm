import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../api/client';
import logo from '../assets/logo.png'


export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f6f8',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 380 }}>
        <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
          CSLM
        </Typography>
        <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              height: 40,
              mr: 2,
              display: 'block'
            }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Gestor del Ciclo de Vida de Certificados y Secretos
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuario"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 3 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Usuarios de prueba: admin / Admin123!, operator / Operator123!, viewer / Viewer123!
        </Typography>
      </Paper>
    </Box>
  );
}
