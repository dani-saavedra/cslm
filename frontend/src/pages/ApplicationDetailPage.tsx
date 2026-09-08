import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { getApplication, getApplicationAssets } from '../api/endpoints';
import type { Application, ApplicationAssetsResponse, SemaphoreStatus } from '../types';
import SemaphoreChip from '../components/SemaphoreChip';
import { criticalityLabel, statusLabel } from '../i18n';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [assets, setAssets] = useState<ApplicationAssetsResponse | null>(null);

  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!id) return;
    getApplication(Number(id)).then(setApp);
    getApplicationAssets(Number(id)).then(setAssets);
  }, [id]);

  const filteredEnvironments = useMemo(() => {
    if (!assets) return [];
    return assets.environments
      .filter((e) => !environmentFilter || String(e.environmentId) === environmentFilter)
      .map((e) => ({
        ...e,
        certificates: assetTypeFilter === 'SECRET' ? [] : e.certificates.filter((c) => !statusFilter || c.status === statusFilter),
        secrets: assetTypeFilter === 'CERTIFICATE' ? [] : e.secrets.filter((s) => !statusFilter || s.status === statusFilter),
      }));
  }, [assets, environmentFilter, assetTypeFilter, statusFilter]);

  if (!app || !assets) return <Typography>Cargando...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/applications')} sx={{ mb: 2 }}>
        Volver a aplicaciones
      </Button>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {app.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {app.code} {app.area ? `· ${app.area}` : ''}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" label={criticalityLabel(app.criticality)} />
              <Chip size="small" label={statusLabel(app.status)} variant="outlined" />
              {app.teamName && <Chip size="small" label={app.teamName} variant="outlined" />}
            </Stack>
          </Box>
          <Button variant="outlined" startIcon={<AccountTreeIcon />} component={RouterLink} to={`/graph/application/${app.id}`}>
            Ver grafo
          </Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Owner
            </Typography>
            <Typography variant="body2">{app.owner || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Correo del owner
            </Typography>
            <Typography variant="body2">{app.ownerEmail || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Descripción
            </Typography>
            <Typography variant="body2">{app.description || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField select label="Ambiente" fullWidth size="small" value={environmentFilter} onChange={(e) => setEnvironmentFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {assets.environments.map((e) => (
                <MenuItem key={e.environmentId} value={e.environmentId}>
                  {e.environmentName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Tipo de activo" fullWidth size="small" value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="CERTIFICATE">Certificados</MenuItem>
              <MenuItem value="SECRET">Secretos</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Estado" fullWidth size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {['ACTIVE', 'REVOKED', 'RENEWED', 'RETIRED', 'ROTATED'].map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabel(s)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {filteredEnvironments.map((env) => (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }} key={env.environmentId}>
          <Typography variant="h6" gutterBottom>
            {env.environmentName}
          </Typography>
          {env.certificates.length === 0 && env.secrets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hay activos en este ambiente que coincidan con los filtros actuales.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Propietario</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {env.certificates.map((c) => (
                  <TableRow key={`cert-${c.id}`} hover>
                    <TableCell>Certificado</TableCell>
                    <TableCell>
                      <RouterLink to={`/certificates/${c.id}`}>{c.name}</RouterLink>
                    </TableCell>
                    <TableCell>{c.owner || '-'}</TableCell>
                    <TableCell>{c.expirationDate}</TableCell>
                    <TableCell>
                      <SemaphoreChip status={c.semaphoreStatus as SemaphoreStatus} days={c.daysRemaining} />
                    </TableCell>
                  </TableRow>
                ))}
                {env.secrets.map((s) => (
                  <TableRow key={`secret-${s.id}`} hover>
                    <TableCell>Secreto</TableCell>
                    <TableCell>
                      <RouterLink to={`/secrets/${s.id}`}>{s.name}</RouterLink>
                    </TableCell>
                    <TableCell>{s.owner || '-'}</TableCell>
                    <TableCell>{s.expirationDate || 'Sin vencimiento'}</TableCell>
                    <TableCell>
                      {s.expirationDate ? <SemaphoreChip status={s.semaphoreStatus as SemaphoreStatus} days={s.daysRemaining} /> : statusLabel(s.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      ))}
      {filteredEnvironments.length === 0 && (
        <Typography color="text.secondary">Esta aplicación aún no tiene ambientes con activos.</Typography>
      )}
    </Box>
  );
}
