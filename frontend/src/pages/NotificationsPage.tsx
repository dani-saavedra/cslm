import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Chip,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { listNotificationHistory } from '../api/endpoints';
import type { NotificationHistoryItem } from '../types';
import { assetTypeLabel } from '../i18n';

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  useEffect(() => {
    listNotificationHistory({ page, size }).then((p) => {
      setRows(p.content);
      setTotal(p.totalElements);
    });
  }, [page, size]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Histórico de notificaciones
      </Typography>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Enviado</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Regla</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Asunto</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{new Date(n.sentAt).toLocaleString('es')}</TableCell>
                  <TableCell>
                    <Link component={RouterLink} to={`/${n.assetType === 'CERTIFICATE' ? 'certificates' : 'secrets'}/${n.assetId}`}>
                      {n.assetName}
                    </Link>
                  </TableCell>
                  <TableCell>{assetTypeLabel(n.assetType)}</TableCell>
                  <TableCell>{n.ruleName || '-'}</TableCell>
                  <TableCell>{n.recipient}</TableCell>
                  <TableCell>{n.subject}</TableCell>
                  <TableCell>
                    <Chip size="small" label={n.status === 'SENT' ? 'Enviado' : 'Fallido'} color={n.status === 'SENT' ? 'success' : 'error'} />
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aún no se han enviado notificaciones.
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
    </Box>
  );
}
