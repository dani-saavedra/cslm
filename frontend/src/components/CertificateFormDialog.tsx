import { useEffect, useState, type ChangeEvent } from 'react';
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
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { Application, AssetType, Certificate, Environment, Team } from '../types';
import { createCertificate, parseCertificateFile, searchApplications, updateCertificate } from '../api/endpoints';
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
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
      setParseError(null);
    }
  }, [open, certificate, environments]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setParsing(true);
    setParseError(null);
    try {
      const parsed = await parseCertificateFile(file);
      setForm((f) => ({
        ...f,
        name: f.name || parsed.suggestedName || f.name,
        commonName: parsed.commonName ?? f.commonName,
        subject: parsed.subject ?? f.subject,
        issuer: parsed.issuer ?? f.issuer,
        serialNumber: parsed.serialNumber ?? f.serialNumber,
        algorithm: parsed.algorithm ?? f.algorithm,
        keySize: parsed.keySize ?? f.keySize,
        issueDate: parsed.issueDate ?? f.issueDate,
        expirationDate: parsed.expirationDate ?? f.expirationDate,
        certificatePem: parsed.certificatePem ?? f.certificatePem,
      }));
    } catch (err) {
      setParseError(errorMessage(err));
    } finally {
      setParsing(false);
    }
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
      lastChangeReference: form.lastChangeReference || null,
      // Only sent when a new file was uploaded in this session; omitted otherwise so the
      // backend keeps whatever certificate file is already stored.
      certificatePem: form.certificatePem || undefined,
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

        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />} disabled={parsing}>
          {parsing ? 'Leyendo certificado...' : 'Cargar archivo de certificado'}
          <input type="file" hidden accept=".pem,.crt,.cer,.der,.txt" onChange={handleFileSelected} />
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Acepta archivos PEM, CRT, CER o DER. Los campos se completan automáticamente a partir del certificado; la
          clave privada nunca se almacena en CSLM, solo el certificado público para poder descargarlo luego.
        </Typography>
        {(form.certificatePem || certificate?.certificateFilePresent) && (
          <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
            {form.certificatePem
              ? 'Archivo de certificado listo para guardar.'
              : 'Este certificado ya tiene un archivo cargado.'}
          </Typography>
        )}
        {parseError && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setParseError(null)}>
            {parseError}
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
          <Grid item xs={12} sm={6}>
            <TextField
              label="Referencia de Cambio (CHG) / Requerimiento (RITM)"
              placeholder="Ej: CHG0012345 o RITM0098765"
              helperText="Número de CHG o RITM con el que se realizó la última actualización"
              fullWidth
              value={form.lastChangeReference || ''}
              onChange={(e) => set('lastChangeReference', e.target.value)}
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
