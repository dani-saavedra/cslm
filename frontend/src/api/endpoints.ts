import { apiClient } from './client';
import type {
  ApplicationAssetsResponse,
  AuditLogEntry,
  Application,
  AssetType,
  Certificate,
  DashboardSummary,
  DeploymentLocation,
  Environment,
  ExpiringAsset,
  GraphResponse,
  LocationType,
  NotificationHistoryItem,
  NotificationRule,
  Page,
  Secret,
  SystemSetting,
  Team,
  User,
} from '../types';

// ---- Auth ----
export interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
  expiresAt: string;
}
export const login = (username: string, password: string) =>
  apiClient.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data);

// ---- Dashboard ----
export const getDashboardSummary = () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data);
export const getExpiringAssets = (withinDays?: number) =>
  apiClient.get<ExpiringAsset[]>('/dashboard/expiring', { params: { withinDays } }).then((r) => r.data);

// ---- Certificates ----
export interface AssetSearchParams {
  environmentId?: number;
  production?: boolean;
  status?: string;
  typeId?: number;
  applicationId?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}
export const searchCertificates = (params: AssetSearchParams) =>
  apiClient.get<Page<Certificate>>('/certificates', { params }).then((r) => r.data);
export const getCertificate = (id: number) => apiClient.get<Certificate>(`/certificates/${id}`).then((r) => r.data);
export const createCertificate = (payload: Record<string, unknown>) =>
  apiClient.post<Certificate>('/certificates', payload).then((r) => r.data);
export const updateCertificate = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<Certificate>(`/certificates/${id}`, payload).then((r) => r.data);
export const deleteCertificate = (id: number) => apiClient.delete(`/certificates/${id}`);
export const getCertificateDependencies = (id: number) =>
  apiClient.get<GraphResponse>(`/certificates/${id}/dependencies`).then((r) => r.data);

// ---- Secrets ----
export const searchSecrets = (params: AssetSearchParams) =>
  apiClient.get<Page<Secret>>('/secrets', { params }).then((r) => r.data);
export const getSecret = (id: number) => apiClient.get<Secret>(`/secrets/${id}`).then((r) => r.data);
export const createSecret = (payload: Record<string, unknown>) =>
  apiClient.post<Secret>('/secrets', payload).then((r) => r.data);
export const updateSecret = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<Secret>(`/secrets/${id}`, payload).then((r) => r.data);
export const deleteSecret = (id: number) => apiClient.delete(`/secrets/${id}`);
export const getSecretDependencies = (id: number) =>
  apiClient.get<GraphResponse>(`/secrets/${id}/dependencies`).then((r) => r.data);

// ---- Applications ----
export const searchApplications = (params: { search?: string; page?: number; size?: number }) =>
  apiClient.get<Page<Application>>('/applications', { params }).then((r) => r.data);
export const getApplication = (id: number) => apiClient.get<Application>(`/applications/${id}`).then((r) => r.data);
export const createApplication = (payload: Record<string, unknown>) =>
  apiClient.post<Application>('/applications', payload).then((r) => r.data);
export const updateApplication = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<Application>(`/applications/${id}`, payload).then((r) => r.data);
export const deleteApplication = (id: number) => apiClient.delete(`/applications/${id}`);
export const getApplicationAssets = (id: number) =>
  apiClient.get<ApplicationAssetsResponse>(`/applications/${id}/assets`).then((r) => r.data);
export const getApplicationGraph = (id: number) =>
  apiClient.get<GraphResponse>(`/applications/${id}/graph`).then((r) => r.data);

// ---- Environments ----
export const listEnvironments = (onlyActive = false) =>
  apiClient.get<Environment[]>('/environments', { params: { onlyActive } }).then((r) => r.data);
export const createEnvironment = (payload: Record<string, unknown>) =>
  apiClient.post<Environment>('/environments', payload).then((r) => r.data);
export const updateEnvironment = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<Environment>(`/environments/${id}`, payload).then((r) => r.data);
export const deleteEnvironment = (id: number) => apiClient.delete(`/environments/${id}`);

// ---- Teams ----
export const listTeams = () => apiClient.get<Team[]>('/teams').then((r) => r.data);
export const createTeam = (payload: Record<string, unknown>) => apiClient.post<Team>('/teams', payload).then((r) => r.data);
export const updateTeam = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<Team>(`/teams/${id}`, payload).then((r) => r.data);
export const deleteTeam = (id: number) => apiClient.delete(`/teams/${id}`);

// ---- Catalogs ----
export const listAssetTypes = (category?: 'CERTIFICATE' | 'SECRET') =>
  apiClient.get<AssetType[]>('/admin/asset-types', { params: { category } }).then((r) => r.data);
export const createAssetType = (payload: Record<string, unknown>) =>
  apiClient.post<AssetType>('/admin/asset-types', payload).then((r) => r.data);
export const updateAssetType = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<AssetType>(`/admin/asset-types/${id}`, payload).then((r) => r.data);
export const deleteAssetType = (id: number) => apiClient.delete(`/admin/asset-types/${id}`);

export const listLocationTypes = () => apiClient.get<LocationType[]>('/admin/location-types').then((r) => r.data);
export const createLocationType = (payload: Record<string, unknown>) =>
  apiClient.post<LocationType>('/admin/location-types', payload).then((r) => r.data);
export const updateLocationType = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<LocationType>(`/admin/location-types/${id}`, payload).then((r) => r.data);
export const deleteLocationType = (id: number) => apiClient.delete(`/admin/location-types/${id}`);

// ---- Deployment locations ----
export const listDeploymentLocations = () => apiClient.get<DeploymentLocation[]>('/deployment-locations').then((r) => r.data);
export const createDeploymentLocation = (payload: Record<string, unknown>) =>
  apiClient.post<DeploymentLocation>('/deployment-locations', payload).then((r) => r.data);
export const updateDeploymentLocation = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<DeploymentLocation>(`/deployment-locations/${id}`, payload).then((r) => r.data);
export const deleteDeploymentLocation = (id: number) => apiClient.delete(`/deployment-locations/${id}`);

// ---- Application <-> Asset links ----
export const linkAsset = (payload: { applicationId: number; assetType: string; assetId: number; isPrimary?: boolean }) =>
  apiClient.post('/application-assets', payload);
export const unlinkAsset = (applicationId: number, assetType: string, assetId: number) =>
  apiClient.delete('/application-assets', { params: { applicationId, assetType, assetId } });

// ---- Asset deployments ----
export const listAssetDeployments = (assetType: string, assetId: number) =>
  apiClient.get(`/asset-deployments`, { params: { assetType, assetId } }).then((r) => r.data);
export const createAssetDeployment = (payload: Record<string, unknown>) =>
  apiClient.post('/asset-deployments', payload).then((r) => r.data);
export const deleteAssetDeployment = (id: number) => apiClient.delete(`/asset-deployments/${id}`);

// ---- Notifications ----
export const listNotificationHistory = (params: { page?: number; size?: number }) =>
  apiClient.get<Page<NotificationHistoryItem>>('/notifications', { params }).then((r) => r.data);
export const sendTestNotification = (assetType: string, assetId: number) =>
  apiClient.post<NotificationHistoryItem>('/notifications/test', { assetType, assetId }).then((r) => r.data);
export const listNotificationRules = () => apiClient.get<NotificationRule[]>('/notifications/rules').then((r) => r.data);
export const createNotificationRule = (payload: Record<string, unknown>) =>
  apiClient.post<NotificationRule>('/notifications/rules', payload).then((r) => r.data);
export const updateNotificationRule = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<NotificationRule>(`/notifications/rules/${id}`, payload).then((r) => r.data);
export const deleteNotificationRule = (id: number) => apiClient.delete(`/notifications/rules/${id}`);

// ---- Audit log ----
export const listAuditLog = (params: { entityName?: string; entityId?: string; page?: number; size?: number }) =>
  apiClient.get<Page<AuditLogEntry>>('/audit-log', { params }).then((r) => r.data);

// ---- Users (admin) ----
export const listUsers = () => apiClient.get<User[]>('/admin/users').then((r) => r.data);
export const createUser = (payload: Record<string, unknown>) => apiClient.post<User>('/admin/users', payload).then((r) => r.data);
export const updateUser = (id: number, payload: Record<string, unknown>) =>
  apiClient.put<User>(`/admin/users/${id}`, payload).then((r) => r.data);
export const deleteUser = (id: number) => apiClient.delete(`/admin/users/${id}`);

// ---- System settings ----
export const listSystemSettings = () => apiClient.get<SystemSetting[]>('/admin/settings').then((r) => r.data);
export const updateSystemSetting = (key: string, value: string) =>
  apiClient.put<SystemSetting>(`/admin/settings/${key}`, { value }).then((r) => r.data);
