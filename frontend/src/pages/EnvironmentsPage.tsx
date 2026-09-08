import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { createEnvironment, deleteEnvironment, listEnvironments, updateEnvironment } from '../api/endpoints';
import type { Environment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { errorMessage } from '../api/client';

export default function EnvironmentsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [rows, setRows] = useState<Environment[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Environment | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    listEnvironments().then(setRows);
  }
  useEffect(load, []);

  function openNew() {
    setEditing(null);
    setForm({ sortOrder: rows.length, active: true });
    setError(null);
    setOpen(true);
  }

  function openEdit(env: Environment) {
    setEditing(env);
    setForm({ ...env });
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description || null,
        production: form.production === true,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active !== false,
      };
      if (editing) {
        await updateEnvironment(editing.id, payload);
      } else {
        await createEnvironment(payload);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleToggleActive(env: Environment) {
    await updateEnvironment(env.id, {
      name: env.name,
      code: env.code,
      description: env.description,
      production: env.production,
      sortOrder: env.sortOrder,
      active: !env.active,
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este ambiente?')) return;
    await deleteEnvironment(id);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Ambientes
        </Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Nuevo ambiente
          </Button>
        )}
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Orden</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Activo</TableCell>
              {isAdmin && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((env) => (
              <TableRow key={env.id} hover>
                <TableCell>{env.sortOrder}</TableCell>
                <TableCell>{env.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={env.code} />
                </TableCell>
                <TableCell>{env.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={env.production ? 'primary' : 'default'}
                    label={env.production ? 'Productivo' : 'No productivo'}
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={env.active} disabled={!isAdmin} onChange={() => handleToggleActive(env)} size="small" />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(env)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => handleDelete(env.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar ambiente' : 'Nuevo ambiente'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Typography color="error">{error}</Typography>}
          <TextField label="Nombre" required value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField
            label="Código"
            required
            value={form.code || ''}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          />
          <TextField label="Descripción" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <FormControlLabel
            control={
              <Switch
                checked={form.production === true}
                onChange={(e) => setForm((f) => ({ ...f, production: e.target.checked }))}
              />
            }
            label="Ambiente productivo"
          />
          <TextField
            label="Orden"
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.code}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
