import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
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
import { deleteApplication, listTeams, searchApplications } from '../api/endpoints';
import type { Application, Team } from '../types';
import ApplicationFormDialog from '../components/ApplicationFormDialog';
import { useAuth } from '../contexts/AuthContext';
import { criticalityLabel, statusLabel } from '../i18n';

const criticalityColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  LOW: 'success',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'error',
};

export default function ApplicationsPage() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'OPERATOR');
  const canDelete = hasRole('ADMIN');

  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  useEffect(() => {
    listTeams().then(setTeams);
  }, []);

  function load() {
    searchApplications({ page, size, search: search || undefined }).then((p) => {
      setRows(p.content);
      setTotal(p.totalElements);
    });
  }

  useEffect(load, [page, size, search]);

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar esta aplicación? Se desvincularán los certificados/secretos asociados.')) return;
    await deleteApplication(id);
    load();
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>
          Aplicaciones
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
            Nueva aplicación
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Buscar"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />
      </Paper>

      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Equipo</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Criticidad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Link component={RouterLink} to={`/applications/${a.id}`}>
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>{a.code}</TableCell>
                  <TableCell>{a.teamName || '-'}</TableCell>
                  <TableCell>{a.owner || '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={criticalityLabel(a.criticality)} color={criticalityColor[a.criticality] || 'default'} />
                  </TableCell>
                  <TableCell>{statusLabel(a.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver grafo">
                      <IconButton size="small" component={RouterLink} to={`/graph/application/${a.id}`}>
                        <AccountTreeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canWrite && (
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(a);
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(a.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron aplicaciones.
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

      <ApplicationFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
        application={editing}
        teams={teams}
      />
    </Box>
  );
}
