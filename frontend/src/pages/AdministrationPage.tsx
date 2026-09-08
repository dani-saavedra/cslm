import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  createAssetType,
  createDeploymentLocation,
  createLocationType,
  createNotificationRule,
  createTeam,
  createUser,
  deleteAssetType,
  deleteDeploymentLocation,
  deleteLocationType,
  deleteNotificationRule,
  deleteTeam,
  deleteUser,
  listAssetTypes,
  listDeploymentLocations,
  listLocationTypes,
  listNotificationRules,
  listSystemSettings,
  listTeams,
  listUsers,
  updateAssetType,
  updateDeploymentLocation,
  updateLocationType,
  updateNotificationRule,
  updateSystemSetting,
  updateTeam,
  updateUser,
} from '../api/endpoints';
import type { AssetType, DeploymentLocation, LocationType, NotificationRule, SystemSetting, Team, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../api/client';
import { assetCategoryLabel } from '../i18n';

function TabPanel({ value, index, children }: { value: number; index: number; children: ReactNode }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

function TeamsTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    listTeams().then(setRows);
  }
  useEffect(load, []);

  function openNew() {
    setEditing(null);
    setName('');
    setDescription('');
    setOpen(true);
  }

  async function handleSave() {
    if (editing) await updateTeam(editing.id, { name, description, active: editing.active });
    else await createTeam({ name, description, active: true });
    setOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este equipo?')) return;
    await deleteTeam(id);
    load();
  }

  return (
    <Box>
      {isAdmin && (
        <Button startIcon={<AddIcon />} onClick={openNew} sx={{ mb: 2 }}>
          Nuevo equipo
        </Button>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell>Activo</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.description || '-'}</TableCell>
              <TableCell>{t.active ? 'Sí' : 'No'}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(t);
                      setName(t.name);
                      setDescription(t.description || '');
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(t.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar equipo' : 'Nuevo equipo'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!name} onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function AssetTypesTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<AssetType[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssetType | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  function load() {
    listAssetTypes().then(setRows);
  }
  useEffect(load, []);

  async function handleSave() {
    if (editing) await updateAssetType(editing.id, form);
    else await createAssetType(form);
    setOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este tipo?')) return;
    await deleteAssetType(id);
    load();
  }

  return (
    <Box>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setForm({ category: 'CERTIFICATE', active: true });
            setOpen(true);
          }}
          sx={{ mb: 2 }}
        >
          Nuevo tipo
        </Button>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Categoría</TableCell>
            <TableCell>Código</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Activo</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell>
                <Chip size="small" label={assetCategoryLabel(t.category)} />
              </TableCell>
              <TableCell>{t.code}</TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.active ? 'Sí' : 'No'}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(t);
                      setForm({ ...t });
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(t.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar tipo' : 'Nuevo tipo'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField select label="Categoría" value={form.category || 'CERTIFICATE'} onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))}>
            <MenuItem value="CERTIFICATE">Certificado</MenuItem>
            <MenuItem value="SECRET">Secreto</MenuItem>
          </TextField>
          <TextField label="Código" value={form.code || ''} onChange={(e) => setForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <TextField label="Nombre" value={form.name || ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          <TextField label="Descripción" value={form.description || ''} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!form.code || !form.name} onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function LocationTypesAndLocationsTab({ isAdmin }: { isAdmin: boolean }) {
  const [types, setTypes] = useState<LocationType[]>([]);
  const [locations, setLocations] = useState<DeploymentLocation[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<Record<string, any>>({});
  const [editingType, setEditingType] = useState<LocationType | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [locForm, setLocForm] = useState<Record<string, any>>({});
  const [editingLoc, setEditingLoc] = useState<DeploymentLocation | null>(null);

  function load() {
    listLocationTypes().then(setTypes);
    listDeploymentLocations().then(setLocations);
  }
  useEffect(load, []);

  async function saveType() {
    if (editingType) await updateLocationType(editingType.id, typeForm);
    else await createLocationType(typeForm);
    setTypeOpen(false);
    load();
  }
  async function saveLocation() {
    if (editingLoc) await updateDeploymentLocation(editingLoc.id, locForm);
    else await createDeploymentLocation(locForm);
    setLocOpen(false);
    load();
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Tipos de ubicación
      </Typography>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingType(null);
            setTypeForm({ active: true });
            setTypeOpen(true);
          }}
          sx={{ mb: 1 }}
        >
          Nuevo tipo
        </Button>
      )}
      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Código</TableCell>
            <TableCell>Nombre</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {types.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell>{t.code}</TableCell>
              <TableCell>{t.name}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingType(t);
                      setTypeForm({ ...t });
                      setTypeOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!window.confirm('¿Eliminar este tipo de ubicación?')) return;
                      await deleteLocationType(t.id);
                      load();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="subtitle1" gutterBottom>
        Ubicaciones de despliegue
      </Typography>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingLoc(null);
            setLocForm({ active: true });
            setLocOpen(true);
          }}
          sx={{ mb: 1 }}
        >
          Nueva ubicación
        </Button>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Cluster</TableCell>
            <TableCell>Namespace</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {locations.map((l) => (
            <TableRow key={l.id} hover>
              <TableCell>{l.name}</TableCell>
              <TableCell>{l.locationTypeName}</TableCell>
              <TableCell>{l.cluster || '-'}</TableCell>
              <TableCell>{l.namespace || '-'}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingLoc(l);
                      setLocForm({ ...l });
                      setLocOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!window.confirm('¿Eliminar esta ubicación de despliegue?')) return;
                      await deleteDeploymentLocation(l.id);
                      load();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={typeOpen} onClose={() => setTypeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingType ? 'Editar tipo de ubicación' : 'Nuevo tipo de ubicación'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Código" value={typeForm.code || ''} onChange={(e) => setTypeForm((f: any) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <TextField label="Nombre" value={typeForm.name || ''} onChange={(e) => setTypeForm((f: any) => ({ ...f, name: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!typeForm.code || !typeForm.name} onClick={saveType}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={locOpen} onClose={() => setLocOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingLoc ? 'Editar ubicación' : 'Nueva ubicación'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nombre" value={locForm.name || ''} onChange={(e) => setLocForm((f: any) => ({ ...f, name: e.target.value }))} />
          <TextField
            select
            label="Tipo"
            value={locForm.locationTypeId || ''}
            onChange={(e) => setLocForm((f: any) => ({ ...f, locationTypeId: e.target.value }))}
          >
            {types.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Cluster" value={locForm.cluster || ''} onChange={(e) => setLocForm((f: any) => ({ ...f, cluster: e.target.value }))} />
          <TextField label="Namespace" value={locForm.namespace || ''} onChange={(e) => setLocForm((f: any) => ({ ...f, namespace: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!locForm.name || !locForm.locationTypeId} onClick={saveLocation}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function NotificationRulesTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<NotificationRule[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  function load() {
    listNotificationRules().then(setRows);
  }
  useEffect(load, []);

  async function handleSave() {
    if (editing) await updateNotificationRule(editing.id, form);
    else await createNotificationRule(form);
    setOpen(false);
    load();
  }

  async function toggle(rule: NotificationRule) {
    await updateNotificationRule(rule.id, { ...rule, enabled: !rule.enabled });
    load();
  }

  return (
    <Box>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setForm({ assetCategory: 'ALL', enabled: true });
            setOpen(true);
          }}
          sx={{ mb: 2 }}
        >
          Nueva regla
        </Button>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Aplica a</TableCell>
            <TableCell>Días antes del vencimiento</TableCell>
            <TableCell>Habilitada</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{assetCategoryLabel(r.assetCategory)}</TableCell>
              <TableCell>{r.daysBefore}</TableCell>
              <TableCell>
                <Switch checked={r.enabled} disabled={!isAdmin} onChange={() => toggle(r)} size="small" />
              </TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(r);
                      setForm({ ...r });
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!window.confirm('¿Eliminar esta regla?')) return;
                      await deleteNotificationRule(r.id);
                      load();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar regla' : 'Nueva regla'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nombre" value={form.name || ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          <TextField
            select
            label="Aplica a"
            value={form.assetCategory || 'ALL'}
            onChange={(e) => setForm((f: any) => ({ ...f, assetCategory: e.target.value }))}
          >
            <MenuItem value="ALL">Todos los activos</MenuItem>
            <MenuItem value="CERTIFICATE">Solo certificados</MenuItem>
            <MenuItem value="SECRET">Solo secretos</MenuItem>
          </TextField>
          <TextField
            label="Días antes del vencimiento (0 = el día del vencimiento)"
            type="number"
            value={form.daysBefore ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, daysBefore: Number(e.target.value) }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!form.name || form.daysBefore === undefined} onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SettingsTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<SystemSetting[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

  function load() {
    listSystemSettings().then(setRows);
  }
  useEffect(load, []);

  async function save(key: string) {
    await updateSystemSetting(key, editing[key]);
    load();
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Los umbrales del semáforo se expresan en días restantes hasta el vencimiento.
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Parámetro</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell>Valor</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>{s.key}</TableCell>
              <TableCell>{s.description}</TableCell>
              <TableCell>
                <TextField
                  size="small"
                  disabled={!isAdmin}
                  value={editing[s.key] ?? s.value}
                  onChange={(e) => setEditing((f) => ({ ...f, [s.key]: e.target.value }))}
                />
              </TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <Button size="small" onClick={() => save(s.key)}>
                    Guardar
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    listUsers().then(setRows);
  }
  useEffect(load, []);

  async function handleSave() {
    setError(null);
    try {
      if (editing) {
        await updateUser(editing.id, { email: form.email, fullName: form.fullName, active: form.active, password: form.password || undefined, roles: form.roles });
      } else {
        await createUser({ username: form.username, email: form.email, fullName: form.fullName, password: form.password, roles: form.roles || ['VIEWER'] });
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Box>
      {isAdmin && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setForm({ roles: ['VIEWER'], active: true });
            setError(null);
            setOpen(true);
          }}
          sx={{ mb: 2 }}
        >
          Nuevo usuario
        </Button>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Usuario</TableCell>
            <TableCell>Correo</TableCell>
            <TableCell>Nombre completo</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell>Activo</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((u) => (
            <TableRow key={u.id} hover>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.fullName || '-'}</TableCell>
              <TableCell>{u.roles.join(', ')}</TableCell>
              <TableCell>{u.active ? 'Sí' : 'No'}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(u);
                      setForm({ ...u, password: '' });
                      setError(null);
                      setOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      if (!window.confirm('¿Eliminar este usuario?')) return;
                      await deleteUser(u.id);
                      load();
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Typography color="error">{error}</Typography>}
          {!editing && (
            <TextField label="Usuario" value={form.username || ''} onChange={(e) => setForm((f: any) => ({ ...f, username: e.target.value }))} />
          )}
          <TextField label="Correo" value={form.email || ''} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
          <TextField label="Nombre completo" value={form.fullName || ''} onChange={(e) => setForm((f: any) => ({ ...f, fullName: e.target.value }))} />
          <TextField
            label={editing ? 'Nueva contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'}
            type="password"
            value={form.password || ''}
            onChange={(e) => setForm((f: any) => ({ ...f, password: e.target.value }))}
          />
          <TextField
            select
            label="Roles"
            SelectProps={{ multiple: true }}
            value={form.roles || []}
            onChange={(e) => setForm((f: any) => ({ ...f, roles: e.target.value }))}
          >
            {['ADMIN', 'OPERATOR', 'VIEWER'].map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdministrationPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Administración
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Equipos" />
          <Tab label="Tipos de activo" />
          <Tab label="Ubicaciones" />
          <Tab label="Reglas de notificación" />
          <Tab label="Umbrales del semáforo" />
          <Tab label="Usuarios" />
        </Tabs>
        <TabPanel value={tab} index={0}>
          <TeamsTab isAdmin={isAdmin} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <AssetTypesTab isAdmin={isAdmin} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <LocationTypesAndLocationsTab isAdmin={isAdmin} />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          <NotificationRulesTab isAdmin={isAdmin} />
        </TabPanel>
        <TabPanel value={tab} index={4}>
          <SettingsTab isAdmin={isAdmin} />
        </TabPanel>
        <TabPanel value={tab} index={5}>
          <UsersTab isAdmin={isAdmin} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
