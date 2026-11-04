import { ApEdition, PlanName } from '@activepieces/shared';
import { t } from 'i18next';

export const PLATFORM_FEATURES = {
  projects: {
    featureKey: 'PROJECTS',
    planThatHasFeature: PlanName.TEAM,
  },
  sso: {
    featureKey: 'SSO',
    planThatHasFeature: PlanName.TEAM,
  },
  projectRoles: {
    featureKey: 'CUSTOM_ROLES',
    planThatHasFeature: PlanName.TEAM,
  },
  globalConnections: {
    featureKey: 'GLOBAL_CONNECTIONS',
    planThatHasFeature: PlanName.TEAM,
  },
  apiKeys: {
    featureKey: 'API',
    planThatHasFeature: PlanName.TEAM,
  },
  secretManagers: {
    featureKey: 'SECRET_MANAGERS',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  auditLogs: {
    featureKey: 'AUDIT_LOGS',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  eventStreaming: {
    featureKey: 'EVENT_DESTINATIONS',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  templates: {
    featureKey: 'TEMPLATES',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  embedding: {
    featureKey: 'SIGNING_KEYS',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  branding: {
    featureKey: 'BRANDING',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  pieces: {
    featureKey: 'PIECES',
    planThatHasFeature: PlanName.ENTERPRISE,
  },
  aiProviders: {
    featureKey: 'UNIVERSAL_AI',
    planThatHasFeature: PlanName.PLUS,
  },
} satisfies Record<string, PlatformFeature>;

function planThatHasFeature({
  featureKey,
  edition,
}: {
  featureKey: FeatureKey | undefined;
  edition: ApEdition | null | undefined;
}): PlanName {
  if (edition !== ApEdition.CLOUD || featureKey === undefined) {
    return PlanName.ENTERPRISE;
  }
  const feature: PlatformFeature | undefined = Object.values(
    PLATFORM_FEATURES,
  ).find((platformFeature) => platformFeature.featureKey === featureKey);
  return feature?.planThatHasFeature ?? PlanName.ENTERPRISE;
}

function includedInPlanLabel(plan: PlanName): string {
  switch (plan) {
    case PlanName.PLUS:
      return t('Included in the Plus plan and up');
    case PlanName.TEAM:
      return t('Included in the Team plan and up');
    default:
      return t('Included in the Enterprise plan');
  }
}

function planBadgeLabel(plan: PlanName): string {
  switch (plan) {
    case PlanName.PLUS:
      return t('Plus plan and up');
    case PlanName.TEAM:
      return t('Team plan and up');
    default:
      return t('Enterprise plan');
  }
}

function askAdminToUpgradeText(plan: PlanName): string {
  switch (plan) {
    case PlanName.PLUS:
      return t('Ask your admin to upgrade to the Plus plan or above.');
    case PlanName.TEAM:
      return t('Ask your admin to upgrade to the Team plan or above.');
    default:
      return t('Ask your admin to turn on the Enterprise plan for your team.');
  }
}

export const platformFeatures = {
  planThatHasFeature,
  includedInPlanLabel,
  planBadgeLabel,
  askAdminToUpgradeText,
};

type PlatformFeature = {
  featureKey: FeatureKey;
  planThatHasFeature?: PlanName;
};

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
  | 'EVENT_DESTINATIONS'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'ENVIRONMENT'
  | 'ISSUES'
  | 'ANALYTICS'
  | 'ALERTS'
  | 'ENTERPRISE_PIECES'
  | 'UNIVERSAL_AI'
  | 'SIGNING_KEYS'
  | 'CUSTOM_ROLES'
  | 'AGENTS'
  | 'TABLES'
  | 'TODOS'
  | 'BILLING'
  | 'MCPS'
  | 'SECRET_MANAGERS'
  | 'DEDICATED_WORKERS';
