import type { SemaphoreStatus } from '../types';

export const SEMAPHORE_COLORS: Record<SemaphoreStatus, string> = {
  GREEN: '#2e7d32',
  YELLOW: '#f9a825',
  ORANGE: '#ef6c00',
  RED: '#c62828',
  EXPIRED: '#212121',
};

export const SEMAPHORE_ICONS: Record<SemaphoreStatus, string> = {
  GREEN: '🟢',
  YELLOW: '🟡',
  ORANGE: '🟠',
  RED: '🔴',
  EXPIRED: '⚫',
};

export const SEMAPHORE_LABELS: Record<SemaphoreStatus, string> = {
  GREEN: 'OK',
  YELLOW: 'Próximo',
  ORANGE: 'Atención',
  RED: 'Crítico',
  EXPIRED: 'Vencido',
};
