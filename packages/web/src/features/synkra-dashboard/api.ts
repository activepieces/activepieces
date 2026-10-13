import { api } from '@/lib/api';

export type DashboardSummary = {
  tier: string;
  status: string;
  plan: {
    name: string;
    executions: number;
    aiOps: number;
    emails: number;
    storageGb: number;
    seats: number;
  };
  usage: {
    executionsThisMonth: number;
    aiOpsUsed: number;
    emailsUsed: number;
    smsUsed: number;
    whatsappUsed: number;
    storageBytesUsed: number;
  };
  recentRuns: {
    id: string;
    flowId: string;
    flowName: string;
    status: string;
    createdAt: string;
  }[];
  connectedIntegrations: number;
  activeWorkflows: number;
};

export const synkraDashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/v1/synkra/dashboard/summary'),
};
