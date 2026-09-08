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
import type { Application, AssetType, Certificate, Environment, Team } from '../types';
import { createCertificate, searchApplications, updateCertificate } from '../api/endpoints';
import { errorMessage } from '../api/client';
import { statusLabel } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  certificate: Certificate | null;
  environments: Environment[];
  certificateTypes: AssetType[];
  teams: Team[];
}

export default function CertificateFormDialog({ open, onClose, onSaved, certificate, environments, certificateTypes, teams }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApps, setSelectedApps] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      searchApplications({ size: 200 }).then((page) => setApplications(page.content));
      setForm(
        certificate
          ? { ...certificate }
          : { expirationDate: '', environmentId: environments[0]?.id ?? '', status: 'ACTIVE' }
      );
      setSelectedApps(certificate?.applications.map((a) => ({ id: a.id, name: a.name, code: a.code } as Application)) ?? []);
      setError(null);
    }
  }, [open, certificate, environments]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      alias: form.alias || null,
      certificateTypeId: form.certificateTypeId || null,
      commonName: form.commonName || null,
      subject: form.subject || null,
      issuer: form.issuer || null,
      serialNumber: form.serialNumber || null,
      algorithm: form.algorithm || null,
      keySize: form.keySize ? Number(form.keySize) : null,
      issueDate: form.issueDate || null,
      expirationDate: form.expirationDate,
      environmentId: form.environmentId,
      owner: form.owner || null,
      teamId: form.teamId || null,
      contactEmail: form.contactEmail || null,
      notes: form.notes || null,
      status: form.status || 'ACTIVE',
      applicationIds: selectedApps.map((a) => a.id),
    };
    try {
      if (certificate) {
        await updateCertificate(certificate.id, payload);
      } else {
        await createCertificate(payload);
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{certificate ? 'Editar certificado' : 'Nuevo certificado'}</DialogTitle>
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
            <TextField label="Alias" fullWidth value={form.alias || ''} onChange={(e) => set('alias', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Tipo"
              fullWidth
              value={form.certificateTypeId || ''}
              onChange={(e) => set('certificateTypeId', e.target.value)}
            >
              <MenuItem value="">(ninguno)</MenuItem>
              {certificateTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Ambiente"
              fullWidth
              required
              value={form.environmentId || ''}
              onChange={(e) => set('environmentId', e.target.value)}
            >
              {environments.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre común (CN)" fullWidth value={form.commonName || ''} onChange={(e) => set('commonName', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Subject" fullWidth value={form.subject || ''} onChange={(e) => set('subject', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Emisor (Issuer)" fullWidth value={form.issuer || ''} onChange={(e) => set('issuer', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Número de serie" fullWidth value={form.serialNumber || ''} onChange={(e) => set('serialNumber', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Algoritmo" fullWidth value={form.algorithm || ''} onChange={(e) => set('algorithm', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Tamaño de clave" type="number" fullWidth value={form.keySize || ''} onChange={(e) => set('keySize', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Estado"
              fullWidth
              value={form.status || 'ACTIVE'}
              onChange={(e) => set('status', e.target.value)}
            >
              {['ACTIVE', 'REVOKED', 'RENEWED', 'RETIRED'].map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de emisión"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.issueDate || ''}
              onChange={(e) => set('issueDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha de vencimiento"
              type="date"
              required
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
            <TextField
              select
              label="Equipo"
              fullWidth
              value={form.teamId || ''}
              onChange={(e) => set('teamId', e.target.value)}
            >
              <MenuItem value="">(ninguno)</MenuItem>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
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
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              minRows={2}
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.expirationDate || !form.environmentId}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
