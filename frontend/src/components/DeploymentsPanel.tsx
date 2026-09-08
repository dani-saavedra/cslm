import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  createAssetDeployment,
  deleteAssetDeployment,
  listAssetDeployments,
  listDeploymentLocations,
  searchApplications,
} from '../api/endpoints';
import type { Application, DeploymentLocation, DeploymentSummary } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function DeploymentsPanel({ assetType, assetId }: { assetType: 'CERTIFICATE' | 'SECRET'; assetId: number }) {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'OPERATOR');

  const [deployments, setDeployments] = useState<DeploymentSummary[]>([]);
  const [locations, setLocations] = useState<DeploymentLocation[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  function load() {
    listAssetDeployments(assetType, assetId).then(setDeployments);
  }

  useEffect(() => {
    load();
    listDeploymentLocations().then(setLocations);
    searchApplications({ size: 200 }).then((page) => setApplications(page.content));
  }, [assetType, assetId]);

  async function handleAdd() {
    await createAssetDeployment({
      assetType,
      assetId,
      deploymentLocationId: form.deploymentLocationId,
      applicationId: form.applicationId || null,
      reference: form.reference || null,
      notes: form.notes || null,
    });
    setOpen(false);
    setForm({});
    load();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este registro de despliegue?')) return;
    await deleteAssetDeployment(id);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Despliegues</Typography>
        {canWrite && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Agregar
          </Button>
        )}
      </Box>
      <List dense>
        {deployments.map((d) => (
          <ListItem key={d.id} divider>
            <ListItemText
              primary={`${d.locationName} (${d.locationTypeCode})`}
              secondary={[d.cluster, d.namespace, d.reference].filter(Boolean).join(' / ') || '-'}
            />
            {canWrite && (
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => handleDelete(d.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            )}
          </ListItem>
        ))}
        {deployments.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aún no está desplegado en ningún lugar.
          </Typography>
        )}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Agregar despliegue</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Ubicación"
            required
            value={form.deploymentLocationId || ''}
            onChange={(e) => setForm((f) => ({ ...f, deploymentLocationId: e.target.value }))}
          >
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name} ({l.locationTypeName})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Aplicación (opcional)"
            value={form.applicationId || ''}
            onChange={(e) => setForm((f) => ({ ...f, applicationId: e.target.value }))}
          >
            <MenuItem value="">(ninguna)</MenuItem>
            {applications.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Referencia"
            placeholder="ej. nombre del secret en k8s, VIP del LB"
            value={form.reference || ''}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
          />
          <TextField
            label="Observaciones"
            multiline
            minRows={2}
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={!form.deploymentLocationId} onClick={handleAdd}>
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
