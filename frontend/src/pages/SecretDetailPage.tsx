import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSecret, listAssetTypes, listEnvironments, listTeams, sendTestNotification } from '../api/endpoints';
import type { AssetType, Environment, Secret, Team } from '../types';
import SemaphoreChip from '../components/SemaphoreChip';
import SecretFormDialog from '../components/SecretFormDialog';
import DeploymentsPanel from '../components/DeploymentsPanel';
import { useAuth } from '../contexts/AuthContext';
import { statusLabel } from '../i18n';

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value ?? '-'}</Typography>
    </Box>
  );
}

export default function SecretDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'OPERATOR');

  const [secret, setSecret] = useState<Secret | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [secretTypes, setSecretTypes] = useState<AssetType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);

  function load() {
    if (id) getSecret(Number(id)).then(setSecret);
  }

  useEffect(load, [id]);
  useEffect(() => {
    listEnvironments().then(setEnvironments);
    listAssetTypes('SECRET').then(setSecretTypes);
    listTeams().then(setTeams);
  }, []);

  if (!secret) return <Typography>Cargando...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/secrets')} sx={{ mb: 2 }}>
        Volver a secretos
      </Button>

      <Alert severity="info" sx={{ mb: 2 }}>
        CSLM solo almacena el metadato de este secreto. El valor real reside en el gestor de secretos externo referenciado abajo.
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {secret.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {secret.expirationDate && <SemaphoreChip status={secret.semaphoreStatus} days={secret.daysRemaining} />}
              <Chip label={statusLabel(secret.status)} variant="outlined" size="small" />
              <Chip label={secret.environmentName} color="primary" variant="outlined" size="small" />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AccountTreeIcon />} component={RouterLink} to={`/graph/secret/${secret.id}`}>
              Ver dependencias
            </Button>
            {canWrite && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Field label="Tipo" value={secret.secretTypeName} />
            <Field label="Descripción" value={secret.description} />
            <Field label="Sistema de almacenamiento" value={secret.storageSystem} />
            <Field label="Referencia" value={secret.secretReference} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Fecha de vencimiento" value={secret.expirationDate || 'Sin vencimiento'} />
            <Field label="Propietario" value={secret.owner} />
            <Field label="Equipo" value={secret.teamName} />
            <Field label="Correo de contacto" value={secret.contactEmail} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Aplicaciones
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {secret.applications.length === 0 && <Typography variant="body2">Sin aplicaciones vinculadas</Typography>}
              {secret.applications.map((a) => (
                <Chip key={a.id} label={a.name} size="small" component={RouterLink} to={`/applications/${a.id}`} clickable />
              ))}
            </Stack>
            <Field label="Observaciones" value={secret.notes} />
            <Button
              size="small"
              onClick={async () => {
                setNotifyStatus('Enviando...');
                const result = await sendTestNotification('SECRET', secret.id);
                setNotifyStatus(`Notificación de prueba: ${result.status}`);
              }}
            >
              Enviar notificación de prueba
            </Button>
            {notifyStatus && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {notifyStatus}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <DeploymentsPanel assetType="SECRET" assetId={secret.id} />
      </Paper>

      <SecretFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
        secret={secret}
        environments={environments}
        secretTypes={secretTypes}
        teams={teams}
      />
    </Box>
  );
}
