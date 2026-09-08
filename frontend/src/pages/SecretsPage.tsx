import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { deleteSecret, listAssetTypes, listEnvironments, listTeams, searchSecrets } from '../api/endpoints';
import type { AssetType, Environment, Secret, Team } from '../types';
import SemaphoreChip from '../components/SemaphoreChip';
import SecretFormDialog from '../components/SecretFormDialog';
import { useAuth } from '../contexts/AuthContext';
import { statusLabel } from '../i18n';

export default function SecretsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'OPERATOR');
  const canDelete = hasRole('ADMIN');

  const [rows, setRows] = useState<Secret[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [environmentId, setEnvironmentId] = useState<string>('');
  const [envKind, setEnvKind] = useState<string>(''); // '' | 'PRODUCTIVE' | 'NON_PRODUCTIVE'

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [secretTypes, setSecretTypes] = useState<AssetType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Secret | null>(null);

  useEffect(() => {
    listEnvironments().then(setEnvironments);
    listAssetTypes('SECRET').then(setSecretTypes);
    listTeams().then(setTeams);
  }, []);

  function load() {
    searchSecrets({
      page,
      size,
      search: search || undefined,
      environmentId: environmentId ? Number(environmentId) : undefined,
      production: envKind === '' ? undefined : envKind === 'PRODUCTIVE',
    }).then((p) => {
      setRows(p.content);
      setTotal(p.totalElements);
    });
  }

  useEffect(load, [page, size, search, environmentId, envKind]);

  const productiveEnvIds = new Set(environments.filter((e) => e.production).map((e) => e.id));

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar el metadato de este secreto? Esta acción no se puede deshacer.')) return;
    await deleteSecret(id);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Secretos
        </Typography>
        {canWrite && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Nuevo secreto
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Buscar (nombre, propietario, sistema de almacenamiento...)"
              fullWidth
              size="small"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Ambiente"
              fullWidth
              size="small"
              value={environmentId}
              onChange={(e) => {
                setPage(0);
                setEnvironmentId(e.target.value);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {environments.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              label="Tipo de ambiente"
              fullWidth
              size="small"
              value={envKind}
              onChange={(e) => {
                setPage(0);
                setEnvKind(e.target.value);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PRODUCTIVE">Productivo</MenuItem>
              <MenuItem value="NON_PRODUCTIVE">No productivo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Aplicación(es)</TableCell>
                <TableCell>Ambiente</TableCell>
                <TableCell>Propietario</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Link component={RouterLink} to={`/secrets/${s.id}`}>
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>{s.secretTypeName || '-'}</TableCell>
                  <TableCell>{s.applications.map((a) => a.name).join(', ') || '-'}</TableCell>
                  <TableCell>
                    {s.environmentName}
                    <Chip
                      size="small"
                      variant="outlined"
                      color={productiveEnvIds.has(s.environmentId) ? 'primary' : 'default'}
                      label={productiveEnvIds.has(s.environmentId) ? 'Productivo' : 'No productivo'}
                      sx={{ ml: 1 }}
                    />
                  </TableCell>
                  <TableCell>{s.owner || '-'}</TableCell>
                  <TableCell>
                    {s.expirationDate ? (
                      <>
                        {s.expirationDate} <SemaphoreChip status={s.semaphoreStatus} days={s.daysRemaining} />
                      </>
                    ) : (
                      'Sin vencimiento'
                    )}
                  </TableCell>
                  <TableCell>{statusLabel(s.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver dependencias">
                      <IconButton size="small" component={RouterLink} to={`/graph/secret/${s.id}`}>
                        <AccountTreeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canWrite && (
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(s);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(s.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron secretos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
        />
      </Paper>

      <SecretFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
        secret={editing}
        environments={environments}
        secretTypes={secretTypes}
        teams={teams}
      />
    </Box>
  );
}
