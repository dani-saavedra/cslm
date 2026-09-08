// Etiquetas en español para los valores de enumeración que devuelve el backend.
// El valor crudo (clave) se sigue enviando en las peticiones; aquí solo se traduce
// lo que se muestra en pantalla.

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  REVOKED: 'Revocado',
  RENEWED: 'Renovado',
  RETIRED: 'Retirado',
  ROTATED: 'Rotado',
  EXPIRED: 'Vencido',
};

export const CRITICALITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  ALL: 'Todos los activos',
  CERTIFICATE: 'Certificados',
  SECRET: 'Secretos',
};

export const ASSET_TYPE_LABELS: Record<string, string> = {
  CERTIFICATE: 'Certificado',
  SECRET: 'Secreto',
};

export const statusLabel = (v?: string | null) => (v ? STATUS_LABELS[v] ?? v : '-');
export const criticalityLabel = (v?: string | null) => (v ? CRITICALITY_LABELS[v] ?? v : '-');
export const assetCategoryLabel = (v?: string | null) => (v ? ASSET_CATEGORY_LABELS[v] ?? v : '-');
export const assetTypeLabel = (v?: string | null) => (v ? ASSET_TYPE_LABELS[v] ?? v : '-');
