import { Chip } from '@mui/material';
import type { SemaphoreStatus } from '../types';
import { SEMAPHORE_COLORS, SEMAPHORE_ICONS, SEMAPHORE_LABELS } from './semaphore';

export default function SemaphoreChip({ status, days }: { status: SemaphoreStatus; days?: number }) {
  const label = days !== undefined && days !== null
    ? `${SEMAPHORE_ICONS[status]} ${SEMAPHORE_LABELS[status]} (${days}d)`
    : `${SEMAPHORE_ICONS[status]} ${SEMAPHORE_LABELS[status]}`;
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        backgroundColor: SEMAPHORE_COLORS[status],
        color: '#fff',
        fontWeight: 600,
      }}
    />
  );
}
