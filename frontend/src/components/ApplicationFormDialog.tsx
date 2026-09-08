import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import type { Application, Team } from '../types';
import { createApplication, updateApplication } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { criticalityLabel, statusLabel } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  application: Application | null;
  teams: Team[];
}

export default function ApplicationFormDialog({ open, onClose, onSaved, application, teams }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(application ? { ...application } : { criticality: 'MEDIUM', status: 'ACTIVE' });
      setError(null);
    }
  }, [open, application]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description || null,
      area: form.area || null,
      teamId: form.teamId || null,
      owner: form.owner || null,
      ownerEmail: form.ownerEmail || null,
      criticality: form.criticality || 'MEDIUM',
      status: form.status || 'ACTIVE',
    };
    try {
      if (application) {
        await updateApplication(application.id, payload);
      } else {
        await createApplication(payload);
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{application ? 'Editar aplicación' : 'Nueva aplicación'}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={7}>
            <TextField label="Nombre" fullWidth required value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Código"
              fullWidth
              required
              disabled={!!application}
              value={form.code || ''}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" fullWidth value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Área" fullWidth value={form.area || ''} onChange={(e) => set('area', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Equipo" fullWidth value={form.teamId || ''} onChange={(e) => set('teamId', e.target.value)}>
              <MenuItem value="">(ninguno)</MenuItem>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Owner" fullWidth value={form.owner || ''} onChange={(e) => set('owner', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Correo del owner" fullWidth value={form.ownerEmail || ''} onChange={(e) => set('ownerEmail', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Criticidad" fullWidth value={form.criticality || 'MEDIUM'} onChange={(e) => set('criticality', e.target.value)}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((c) => (
                <MenuItem key={c} value={c}>
                  {criticalityLabel(c)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Estado" fullWidth value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}>
              {['ACTIVE', 'INACTIVE'].map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.code}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
