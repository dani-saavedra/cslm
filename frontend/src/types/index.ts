export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApplicationSummary {
  id: number;
  name: string;
  code: string;
}

export interface DeploymentSummary {
  id: number;
  locationId: number;
  locationName: string;
  locationTypeCode: string;
  cluster: string | null;
  namespace: string | null;
  reference: string | null;
  applicationId: number | null;
  applicationName: string | null;
}

export type SemaphoreStatus = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'EXPIRED';

export interface Certificate {
  id: number;
  name: string;
  alias: string | null;
  certificateTypeId: number | null;
  certificateTypeName: string | null;
  commonName: string | null;
  subject: string | null;
  issuer: string | null;
  serialNumber: string | null;
  algorithm: string | null;
  keySize: number | null;
  issueDate: string | null;
  expirationDate: string;
  daysRemaining: number;
  semaphoreStatus: SemaphoreStatus;
  environmentId: number;
  environmentName: string;
  owner: string | null;
  teamId: number | null;
  teamName: string | null;
  contactEmail: string | null;
  notes: string | null;
  status: string;
  applications: ApplicationSummary[];
  deployments: DeploymentSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface Secret {
  id: number;
  name: string;
  secretTypeId: number | null;
  secretTypeName: string | null;
  description: string | null;
  storageSystem: string | null;
  secretReference: string | null;
  environmentId: number;
  environmentName: string;
  owner: string | null;
  teamId: number | null;
  teamName: string | null;
  contactEmail: string | null;
  expirationDate: string | null;
  daysRemaining: number;
  semaphoreStatus: SemaphoreStatus;
  status: string;
  notes: string | null;
  applications: ApplicationSummary[];
  deployments: DeploymentSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  name: string;
  code: string;
  description: string | null;
  area: string | null;
  teamId: number | null;
  teamName: string | null;
  owner: string | null;
  ownerEmail: string | null;
  criticality: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationAssetsResponse {
  applicationId: number;
  applicationName: string;
  environments: {
    environmentId: number;
    environmentName: string;
    certificates: Certificate[];
    secrets: Secret[];
  }[];
}

export interface Environment {
  id: number;
  name: string;
  code: string;
  description: string | null;
  production: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetType {
  id: number;
  category: 'CERTIFICATE' | 'SECRET';
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface LocationType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface DeploymentLocation {
  id: number;
  name: string;
  locationTypeId: number;
  locationTypeName: string;
  cluster: string | null;
  namespace: string | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: number;
  name: string;
  assetCategory: 'CERTIFICATE' | 'SECRET' | 'ALL';
  daysBefore: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationHistoryItem {
  id: number;
  assetType: 'CERTIFICATE' | 'SECRET';
  assetId: number;
  assetName: string;
  ruleId: number | null;
  ruleName: string | null;
  recipient: string;
  subject: string;
  status: 'SENT' | 'FAILED';
  errorMessage: string | null;
  sentAt: string;
}

export interface AuditLogEntry {
  id: number;
  username: string;
  action: string;
  entityName: string;
  entityId: string | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface DashboardSummary {
  totalCertificates: number;
  totalSecrets: number;
  totalApplications: number;
  totalEnvironments: number;
  certificatesExpiringSoon: number;
  secretsExpiringSoon: number;
  certificatesExpired: number;
  secretsExpired: number;
  semaphoreCounts: Record<SemaphoreStatus, number>;
}

export interface ExpiringAsset {
  assetType: 'CERTIFICATE' | 'SECRET';
  assetId: number;
  name: string;
  applicationNames: string;
  environmentName: string;
  owner: string | null;
  expirationDate: string;
  daysRemaining: number;
  semaphoreStatus: SemaphoreStatus;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  data: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  active: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
}
