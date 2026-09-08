import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getApplicationGraph, getCertificateDependencies, getSecretDependencies } from '../api/endpoints';
import type { GraphResponse } from '../types';
import GraphView from '../components/GraphView';

interface Props {
  kind: 'certificate' | 'secret' | 'application';
}

const titles: Record<Props['kind'], string> = {
  certificate: 'Dependencias del certificado',
  secret: 'Dependencias del secreto',
  application: 'Grafo de la aplicación',
};

export default function GraphPage({ kind }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [graph, setGraph] = useState<GraphResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    const fetcher =
      kind === 'certificate' ? getCertificateDependencies : kind === 'secret' ? getSecretDependencies : getApplicationGraph;
    fetcher(numericId).then(setGraph);
  }, [kind, id]);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Volver
      </Button>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {titles[kind]}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Haz clic en un nodo para ver su detalle.
      </Typography>
      {graph ? <GraphView graph={graph} height={620} /> : <Typography>Cargando...</Typography>}
    </Box>
  );
}
