import { PiecesFilterType, PlatformPlanLimits } from '@activepieces/shared';


export type FlowPlanLimits = {
  nickname: string;
  tasks: number | null;
  pieces: string[];
  aiCredits: number | null;
  piecesFilterType: PiecesFilterType;
};

export const MAXIMUM_ALLOWED_TASKS = 1000000;

export const DEFAULT_FREE_PLAN_LIMIT = {
  nickname: 'free-pay-as-you-go',
  tasks: 1000,
  pieces: [],
  aiCredits: 200,
  piecesFilterType: PiecesFilterType.NONE,
};

export const FREE_CLOUD_PLAN: PlatformPlanLimits = {
  tasksLimit: 1000,
  aiCreditsLimit: 200,
  embeddingEnabled: false,
  tablesEnabled: true,
  todosEnabled: true,
  globalConnectionsEnabled: false,
  customRolesEnabled: false,
  includedTasks: 1000,
  includedAiCredits: 200,
  environmentsEnabled: false,
  analyticsEnabled: false,
  showPoweredBy: false,
  auditLogEnabled: false,
  managePiecesEnabled: false,
  manageTemplatesEnabled: false,
  customAppearanceEnabled: false,
  manageProjectsEnabled: false,
  projectRolesEnabled: false,
  customDomainsEnabled: false,
  apiKeysEnabled: false,
  alertsEnabled: false,
  ssoEnabled: false,
}

export const OPENSOURCE_PLAN: PlatformPlanLimits = {
  embeddingEnabled: false,
  tablesEnabled: true,
  todosEnabled: true,
  globalConnectionsEnabled: false,
  customRolesEnabled: false,
  includedTasks: 0,
  includedAiCredits: 0,
  environmentsEnabled: false,
  analyticsEnabled: false,
  showPoweredBy: false,
  auditLogEnabled: false,
  managePiecesEnabled: false,
  manageTemplatesEnabled: false,
  customAppearanceEnabled: false,
  tasksLimit: undefined,
  manageProjectsEnabled: false,
  projectRolesEnabled: false,
  customDomainsEnabled: false,
  apiKeysEnabled: false,
  alertsEnabled: false,
  ssoEnabled: false,
  stripeCustomerId: undefined,
  stripeSubscriptionId: undefined,
  stripeSubscriptionStatus: undefined,
}

export function getTasksPriceId(stripeKey: string | undefined) {
  const testMode = stripeKey?.startsWith('sk_test');
  return testMode
    ? 'price_1OnWqKKZ0dZRqLEKkcYBso8K'
    : 'price_1Qf7RiKZ0dZRqLEKAgP38l7w';
}

export const PRICE_PER_1000_TASKS = 1;

export enum ApSubscriptionStatus {
  ACTIVE = 'active',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNAPID = 'unpaid',
}
