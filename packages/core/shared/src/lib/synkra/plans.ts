/**
 * Synkra Flow tier definitions — single source of truth.
 * Read-only, code-defined. Never editable from any UI.
 */
export type SynkraTier = 'free' | 'starter' | 'business' | 'pro';

export interface SynkraPlanLimits {
  tier: SynkraTier;
  name: string;
  priceZar: number;
  seats: number;
  workspaces: number;
  executions: number;
  activeWorkflows: number;
  draftWorkflows: number;
  maxWorkflowSteps: number;
  storageGb: number;
  emails: number;
  aiOps: number;
  sms: number;
  whatsapp: number;
  voiceMinutes: number;
  integrations: boolean;
  sso: boolean;
  apiKeys: boolean;
  customDomain: boolean;
  auditLogs: boolean;
  auditRetentionDays: number;
  whiteLabel: boolean;
  apiKeysLimit: number;
  customRolesLimit: number;
  ssoDomainLimit: number;
  studentDiscountZar: number;
  communityDiscountZar: number;
}

export const SYNKRA_PLANS: Record<SynkraTier, SynkraPlanLimits> = {
  free: {
    tier: 'free', name: 'Free', priceZar: 0,
    seats: 1, workspaces: 1, executions: 500,
    activeWorkflows: 5, draftWorkflows: 10, maxWorkflowSteps: 10,
    storageGb: 1, emails: 300, aiOps: 0, sms: 0, whatsapp: 0, voiceMinutes: 0,
    integrations: true, sso: false, apiKeys: false, customDomain: false,
    auditLogs: false, auditRetentionDays: 0, whiteLabel: false,
    apiKeysLimit: 0, customRolesLimit: 0, ssoDomainLimit: 0,
    studentDiscountZar: 0, communityDiscountZar: 0,
  },
  starter: {
    tier: 'starter', name: 'Starter', priceZar: 299,
    seats: 3, workspaces: 1, executions: 15000,
    activeWorkflows: 25, draftWorkflows: 50, maxWorkflowSteps: 25,
    storageGb: 10, emails: 2000, aiOps: 1000, sms: 0, whatsapp: 0, voiceMinutes: 0,
    integrations: true, sso: false, apiKeys: false, customDomain: false,
    auditLogs: false, auditRetentionDays: 0, whiteLabel: false,
    apiKeysLimit: 0, customRolesLimit: 0, ssoDomainLimit: 0,
    studentDiscountZar: 50, communityDiscountZar: 50,
  },
  business: {
    tier: 'business', name: 'Business', priceZar: 599,
    seats: 10, workspaces: 3, executions: 50000,
    activeWorkflows: 100, draftWorkflows: 200, maxWorkflowSteps: 50,
    storageGb: 50, emails: 10000, aiOps: 5000, sms: 0, whatsapp: 0, voiceMinutes: 0,
    integrations: true, sso: true, apiKeys: true, customDomain: false,
    auditLogs: true, auditRetentionDays: 30, whiteLabel: false,
    apiKeysLimit: 10, customRolesLimit: 10, ssoDomainLimit: 1,
    studentDiscountZar: 150, communityDiscountZar: 150,
  },
  pro: {
    tier: 'pro', name: 'Pro', priceZar: 999,
    seats: 25, workspaces: 10, executions: 150000,
    activeWorkflows: 500, draftWorkflows: 1000, maxWorkflowSteps: 100,
    storageGb: 200, emails: 50000, aiOps: 20000, sms: 0, whatsapp: 0, voiceMinutes: 0,
    integrations: true, sso: true, apiKeys: true, customDomain: false,
    auditLogs: true, auditRetentionDays: 90, whiteLabel: false,
    apiKeysLimit: 25, customRolesLimit: 50, ssoDomainLimit: 3,
    studentDiscountZar: 250, communityDiscountZar: 250,
  },
};

export const SYNKRA_TIER_ORDER: SynkraTier[] = ['free', 'starter', 'business', 'pro'];

export function normalizeTier(tier: unknown): SynkraTier {
  const v = typeof tier === 'string' ? tier.trim().toLowerCase() : '';
  return (SYNKRA_TIER_ORDER as string[]).includes(v) ? (v as SynkraTier) : 'free';
}

export function getPlanLimits(tier: unknown): SynkraPlanLimits {
  return SYNKRA_PLANS[normalizeTier(tier)];
}

export function getEffectivePriceZar(
  tier: unknown,
  eligibility: { studentVerified?: boolean; communityVerified?: boolean },
): number {
  const plan = getPlanLimits(tier);
  const discount = Math.max(
    eligibility.studentVerified ? plan.studentDiscountZar : 0,
    eligibility.communityVerified ? plan.communityDiscountZar : 0,
  );
  return Math.max(0, plan.priceZar - discount);
}
