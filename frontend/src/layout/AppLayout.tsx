import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import KeyIcon from '@mui/icons-material/Key';
import AppsIcon from '@mui/icons-material/Apps';
import LayersIcon from '@mui/icons-material/Layers';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'

const drawerWidth = 240;

const navItems = [
  { label: 'Panel', path: '/', icon: <DashboardIcon /> },
  { label: 'Certificados', path: '/certificates', icon: <VerifiedUserIcon /> },
  { label: 'Secretos', path: '/secrets', icon: <KeyIcon /> },
  { label: 'Aplicaciones', path: '/applications', icon: <AppsIcon /> },
  { label: 'Ambientes', path: '/environments', icon: <LayersIcon /> },
  { label: 'Notificaciones', path: '/notifications', icon: <NotificationsIcon /> },
  { label: 'Administración', path: '/administration', icon: <SettingsIcon /> },
];

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { username, roles, logout } = useAuth();
  const navigate = useNavigate();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap fontWeight={700} color="primary">
          CSLM
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === '/'}
            sx={{
              '&.active': { backgroundColor: 'action.selected', borderRight: '3px solid', borderColor: 'primary.main' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                height: 40,      // Ajusta el tamaño que prefieras
                mr: 2,           // Margen a la derecha para separar del texto
                display: 'block'
              }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Gestor del Ciclo de Vida de Certificados y Secretos
          </Typography>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {username} ({roles.join(', ')})
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
