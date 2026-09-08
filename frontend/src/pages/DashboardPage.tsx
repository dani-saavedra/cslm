import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getDashboardSummary, getExpiringAssets } from '../api/endpoints';
import type { DashboardSummary, ExpiringAsset, SemaphoreStatus } from '../types';
import SemaphoreChip from '../components/SemaphoreChip';
import { SEMAPHORE_COLORS, SEMAPHORE_ICONS, SEMAPHORE_LABELS } from '../components/semaphore';
import { assetTypeLabel } from '../i18n';

function SummaryCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expiring, setExpiring] = useState<ExpiringAsset[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getDashboardSummary().then(setSummary);
    getExpiringAssets().then(setExpiring);
  }, []);

  const filtered = useMemo(
    () =>
      expiring.filter((e) =>
        [e.name, e.applicationNames, e.environmentName, e.owner ?? ''].join(' ').toLowerCase().includes(filter.toLowerCase())
      ),
    [expiring, filter]
  );

  const semaphoreOrder: SemaphoreStatus[] = ['GREEN', 'YELLOW', 'ORANGE', 'RED', 'EXPIRED'];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Panel
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Certificados" value={summary?.totalCertificates ?? '-'} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Secretos" value={summary?.totalSecrets ?? '-'} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Aplicaciones" value={summary?.totalApplications ?? '-'} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Ambientes" value={summary?.totalEnvironments ?? '-'} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Certificados próximos a vencer" value={summary?.certificatesExpiringSoon ?? '-'} color="warning.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Secretos próximos a vencer" value={summary?.secretsExpiringSoon ?? '-'} color="warning.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Certificados vencidos" value={summary?.certificatesExpired ?? '-'} color="error.main" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label="Secretos vencidos" value={summary?.secretsExpired ?? '-'} color="error.main" />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen del semáforo
        </Typography>
        <Grid container spacing={2}>
          {semaphoreOrder.map((status) => (
            <Grid item xs={6} sm={2.4} key={status}>
              <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 1, bgcolor: SEMAPHORE_COLORS[status], color: '#fff' }}>
                <Typography variant="h5">{SEMAPHORE_ICONS[status]}</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {summary?.semaphoreCounts?.[status] ?? 0}
                </Typography>
                <Typography variant="caption">{SEMAPHORE_LABELS[status]}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Próximos vencimientos</Typography>
          <TextField
            size="small"
            placeholder="Filtrar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Activo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Aplicación</TableCell>
                <TableCell>Ambiente</TableCell>
                <TableCell>Propietario</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Días</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered
                .sort((a, b) => a.daysRemaining - b.daysRemaining)
                .map((row) => (
                  <TableRow key={`${row.assetType}-${row.assetId}`} hover>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/${row.assetType === 'CERTIFICATE' ? 'certificates' : 'secrets'}/${row.assetId}`}
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>{assetTypeLabel(row.assetType)}</TableCell>
                    <TableCell>{row.applicationNames || '-'}</TableCell>
                    <TableCell>{row.environmentName}</TableCell>
                    <TableCell>{row.owner || '-'}</TableCell>
                    <TableCell>{row.expirationDate}</TableCell>
                    <TableCell>{row.daysRemaining}</TableCell>
                    <TableCell>
                      <SemaphoreChip status={row.semaphoreStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron próximos vencimientos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
