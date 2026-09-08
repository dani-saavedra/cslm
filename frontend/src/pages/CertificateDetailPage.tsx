import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCertificate, listAssetTypes, listEnvironments, listTeams, sendTestNotification } from '../api/endpoints';
import type { AssetType, Certificate, Environment, Team } from '../types';
import SemaphoreChip from '../components/SemaphoreChip';
import CertificateFormDialog from '../components/CertificateFormDialog';
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

export default function CertificateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canWrite = hasRole('ADMIN', 'OPERATOR');

  const [cert, setCert] = useState<Certificate | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<AssetType[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);

  function load() {
    if (id) getCertificate(Number(id)).then(setCert);
  }

  useEffect(load, [id]);
  useEffect(() => {
    listEnvironments().then(setEnvironments);
    listAssetTypes('CERTIFICATE').then(setCertificateTypes);
    listTeams().then(setTeams);
  }, []);

  if (!cert) return <Typography>Cargando...</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/certificates')} sx={{ mb: 2 }}>
        Volver a certificados
      </Button>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {cert.name}
            </Typography>
            {cert.alias && (
              <Typography variant="body1" color="text.secondary">
                {cert.alias}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <SemaphoreChip status={cert.semaphoreStatus} days={cert.daysRemaining} />
              <Chip label={statusLabel(cert.status)} variant="outlined" size="small" />
              <Chip label={cert.environmentName} color="primary" variant="outlined" size="small" />
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<AccountTreeIcon />} component={RouterLink} to={`/graph/certificate/${cert.id}`}>
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
            <Field label="Nombre común (CN)" value={cert.commonName} />
            <Field label="Subject" value={cert.subject} />
            <Field label="Emisor (Issuer)" value={cert.issuer} />
            <Field label="Número de serie" value={cert.serialNumber} />
            <Field label="Algoritmo" value={cert.algorithm} />
            <Field label="Tamaño de clave" value={cert.keySize} />
            <Field label="Tipo" value={cert.certificateTypeName} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Field label="Fecha de emisión" value={cert.issueDate} />
            <Field label="Fecha de vencimiento" value={cert.expirationDate} />
            <Field label="Días restantes" value={cert.daysRemaining} />
            <Field label="Propietario" value={cert.owner} />
            <Field label="Equipo" value={cert.teamName} />
            <Field label="Correo de contacto" value={cert.contactEmail} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              Aplicaciones
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {cert.applications.length === 0 && <Typography variant="body2">Sin aplicaciones vinculadas</Typography>}
              {cert.applications.map((a) => (
                <Chip key={a.id} label={a.name} size="small" component={RouterLink} to={`/applications/${a.id}`} clickable />
              ))}
            </Stack>
            <Field label="Observaciones" value={cert.notes} />
            <Button
              size="small"
              onClick={async () => {
                setNotifyStatus('Enviando...');
                const result = await sendTestNotification('CERTIFICATE', cert.id);
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
        <DeploymentsPanel assetType="CERTIFICATE" assetId={cert.id} />
      </Paper>

      <CertificateFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
        certificate={cert}
        environments={environments}
        certificateTypes={certificateTypes}
        teams={teams}
      />
    </Box>
  );
}
