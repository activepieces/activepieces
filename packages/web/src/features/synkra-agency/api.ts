import { api } from '@/lib/api';

export type AgencyTier = 'agency_20' | 'agency_100' | 'agency_500';
export type ClientTier = 'starter' | 'business' | 'pro';

export type Agency = {
  id: string;
  name: string;
  tier: AgencyTier;
  status: 'draft' | 'active' | 'suspended' | 'cancelled';
  clientEnvironmentsLimit: number;
  wholesaleDiscount: number;
  clientCount: number;
  activeClientCount: number;
  monthlyWholesaleZar: number;
  branding: Record<string, unknown>;
  activatedAt: string | null;
  createdAt: string;
};

export type AgencyClient = {
  id: string;
  projectId: string;
  name: string;
  status: 'draft' | 'active' | 'suspended' | 'transferred';
  clientTier: ClientTier;
  wholesaleMonthlyZar: number;
  activatedAt: string | null;
  createdAt: string;
};

export type AgencyPricing = {
  tiers: Record<AgencyTier, { name: string; feeZar: number; clientLimit: number; wholesaleDiscount: number }>;
  publicTiers: Record<ClientTier, number>;
};

export const synkraAgencyApi = {
  get: () => api.get<Agency>('/v1/synkra/agency'),
  updateProfile: (params: { name: string }) => api.patch('/v1/synkra/agency', params),
  activate: () => api.post('/v1/synkra/agency/activate', {}),
  suspend: () => api.post('/v1/synkra/agency/suspend', {}),
  updateTier: (tier: AgencyTier) => api.post('/v1/synkra/agency/tier', { tier }),
  updateBranding: (branding: Record<string, unknown>) =>
    api.patch('/v1/synkra/agency/branding', branding),
  listClients: () => api.get<{ clients: AgencyClient[] }>('/v1/synkra/agency/clients'),
  createClient: (params: { name: string; clientTier: ClientTier }) =>
    api.post<{ id: string; projectId: string }>('/v1/synkra/agency/clients', params),
  activateClient: (id: string) => api.post(`/v1/synkra/agency/clients/${id}/activate`, {}),
  suspendClient: (id: string) => api.post(`/v1/synkra/agency/clients/${id}/suspend`, {}),
  transferClient: (id: string) => api.post(`/v1/synkra/agency/clients/${id}/transfer`, {}),
  getPricing: () => api.get<AgencyPricing>('/v1/synkra/agency/pricing'),
  wholesalePreview: (params: { clientTier: ClientTier; agencyTier: AgencyTier }) =>
    api.post<{ wholesaleZar: number; discount: number }>('/v1/synkra/agency/wholesale-preview', params),
};
