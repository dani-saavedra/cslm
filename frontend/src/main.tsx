import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme(
  {
    palette: {
      // Davivienda-style red
      primary: { main: '#E1251B', dark: '#B01710', light: '#F0554B', contrastText: '#ffffff' },
      secondary: { main: '#4A4A4A', dark: '#333333', light: '#6E6E6E', contrastText: '#ffffff' },
    },
    components: {
      // Links use a neutral dark tone instead of the red primary color
      MuiLink: {
        defaultProps: { color: '#1f3a5f', underline: 'hover' },
        styleOverrides: {
          root: {
            color: '#1f3a5f',
            textDecorationColor: 'rgba(31, 58, 95, 0.4)',
            '&:hover': { color: '#12253d' },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          'a:not([class])': {
            color: '#1f3a5f',
            textDecorationColor: 'rgba(31, 58, 95, 0.4)',
          },
        },
      },
    },
  },
  esES
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
