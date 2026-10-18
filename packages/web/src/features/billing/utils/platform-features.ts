import { FeatureKey } from '../components/request-trial';

import { FeatureTier } from './feature-tier';

export const PLATFORM_FEATURES = {
  projects: {
    featureKey: 'PROJECTS',
    tier: 'team',
  },
  sso: {
    featureKey: 'SSO',
    tier: 'team',
  },
  projectRoles: {
    featureKey: 'CUSTOM_ROLES',
    tier: 'team',
  },
  globalConnections: {
    featureKey: 'GLOBAL_CONNECTIONS',
    tier: 'team',
  },
  apiKeys: {
    featureKey: 'API',
    tier: 'team',
  },
  secretManagers: {
    featureKey: 'SECRET_MANAGERS',
    tier: 'enterprise',
  },
  auditLogs: {
    featureKey: 'AUDIT_LOGS',
    tier: 'enterprise',
  },
  eventStreaming: {
    featureKey: 'EVENT_DESTINATIONS',
    tier: 'enterprise',
  },
  templates: {
    featureKey: 'TEMPLATES',
    tier: 'enterprise',
  },
  embedding: {
    featureKey: 'SIGNING_KEYS',
    tier: 'enterprise',
  },
  branding: {
    featureKey: 'BRANDING',
    tier: 'enterprise',
  },
  pieces: {
    featureKey: 'PIECES',
    tier: 'enterprise',
  },
  aiProviders: {
    featureKey: 'UNIVERSAL_AI',
    tier: 'plus',
  },
} satisfies Record<string, PlatformFeature>;

type PlatformFeature = {
  featureKey: FeatureKey;
  tier?: FeatureTier;
};
