import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import type { Application, AssetType, Environment, Secret, Team } from '../types';
import { createSecret, searchApplications, updateSecret } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { statusLabel } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  secret: Secret | null;
  environments: Environment[];
  secretTypes: AssetType[];
  teams: Team[];
}

export default function SecretFormDialog({ open, onClose, onSaved, secret, environments, secretTypes, teams }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApps, setSelectedApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      searchApplications({ size: 200 }).then((page) => setApplications(page.content));
      setForm(secret ? { ...secret } : { environmentId: environments[0]?.id ?? '', status: 'ACTIVE' });
      setSelectedApps(secret?.applications.map((a) => ({ id: a.id, name: a.name, code: a.code } as Application)) ?? []);
      setError(null);
    }
  }, [open, secret, environments]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      secretTypeId: form.secretTypeId || null,
      description: form.description || null,
      storageSystem: form.storageSystem || null,
      secretReference: form.secretReference || null,
      environmentId: form.environmentId,
      owner: form.owner || null,
      teamId: form.teamId || null,
      contactEmail: form.contactEmail || null,
      expirationDate: form.expirationDate || null,
      status: form.status || 'ACTIVE',
      notes: form.notes || null,
      applicationIds: selectedApps.map((a) => a.id),
    };
    try {
      if (secret) {
        await updateSecret(secret.id, payload);
      } else {
        await createSecret(payload);
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
      <DialogTitle>{secret ? 'Editar secreto' : 'Nuevo secreto'}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre" fullWidth required value={form.name || ''} onChange={(e) => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Tipo" fullWidth value={form.secretTypeId || ''} onChange={(e) => set('secretTypeId', e.target.value)}>
              <MenuItem value="">(ninguno)</MenuItem>
              {secretTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" fullWidth value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Sistema de almacenamiento" fullWidth value={form.storageSystem || ''} onChange={(e) => set('storageSystem', e.target.value)} placeholder="ej. HashiCorp Vault" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Referencia" fullWidth value={form.secretReference || ''} onChange={(e) => set('secretReference', e.target.value)} placeholder="ruta/id en el vault (nunca el valor)" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Ambiente" fullWidth required value={form.environmentId || ''} onChange={(e) => set('environmentId', e.target.value)}>
              {environments.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de vencimiento (opcional)"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.expirationDate || ''}
              onChange={(e) => set('expirationDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Propietario" fullWidth value={form.owner || ''} onChange={(e) => set('owner', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Correo de contacto" fullWidth value={form.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} />
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
            <TextField select label="Estado" fullWidth value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}>
              {['ACTIVE', 'ROTATED', 'REVOKED', 'RETIRED'].map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={applications}
              value={selectedApps}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, value) => setSelectedApps(value)}
              renderInput={(params) => <TextField {...params} label="Aplicaciones" />}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Observaciones" fullWidth multiline minRows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.environmentId}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
