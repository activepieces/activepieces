import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import React from 'react';

import { FeatureSample } from '@/app/components/feature-sample';
import { FeatureTeaser } from '@/app/components/feature-teaser';
import { PLATFORM_FEATURES, PlatformFeature } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

import { rolesPlan } from './security/project-role/sample-roles';

export function PlanFeatureSample({
  feature,
  children,
}: PlanFeatureSampleProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { isLocked, teaser } = PLAN_FEATURE_SAMPLES[feature];

  return (
    <FeatureSample
      locked={isLocked(platform.plan)}
      title={teaser.title}
      description={teaser.description}
      tier={teaser.tier}
      documentationUrl={teaser.documentationUrl}
      featureKey={teaser.featureKey}
    >
      {children}
    </FeatureSample>
  );
}

export function PlanFeatureGuard({
  feature,
  children,
}: PlanFeatureSampleProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { isLocked, teaser } = PLAN_FEATURE_SAMPLES[feature];

  return isLocked(platform.plan) ? <FeatureTeaser {...teaser} /> : children;
}

const PLAN_FEATURE_SAMPLES: Record<PlanFeature, PlanFeatureSampleSpec> = {
  sso: {
    isLocked: (plan) => !plan.ssoEnabled,
    teaser: PLATFORM_FEATURES.sso,
  },
  projectRoles: {
    isLocked: rolesPlan.isLocked,
    teaser: PLATFORM_FEATURES.projectRoles,
  },
  globalConnections: {
    isLocked: (plan) => !plan.globalConnectionsEnabled,
    teaser: PLATFORM_FEATURES.globalConnections,
  },
  templates: {
    isLocked: (plan) => !plan.manageTemplatesEnabled,
    teaser: PLATFORM_FEATURES.templates,
  },
  embedding: {
    isLocked: (plan) => !plan.embeddingEnabled,
    teaser: PLATFORM_FEATURES.embedding,
  },
  apiKeys: {
    isLocked: (plan) => !plan.apiKeysEnabled,
    teaser: PLATFORM_FEATURES.apiKeys,
  },
  secretManagers: {
    isLocked: (plan) => !plan.secretManagersEnabled,
    teaser: PLATFORM_FEATURES.secretManagers,
  },
  auditLogs: {
    isLocked: (plan) => !plan.auditLogEnabled,
    teaser: PLATFORM_FEATURES.auditLogs,
  },
  pieceSets: {
    isLocked: (plan) => !plan.managePiecesEnabled,
    teaser: {
      ...PLATFORM_FEATURES.pieces,
      title: 'Piece policies',
      description:
        'Decide which pieces, and which actions inside them, each project may build with. Projects use the Default policy unless you assign another.',
    },
  },
  addStepMenu: {
    isLocked: (plan) => !plan.managePiecesEnabled,
    teaser: {
      ...PLATFORM_FEATURES.pieces,
      title: 'Piece menu layout',
      description:
        'Choose the tabs and pieces builders see when they add a step to a flow, in the order your teams use them.',
    },
  },
  eventStreaming: {
    isLocked: (plan) => !plan.eventStreamingEnabled,
    teaser: PLATFORM_FEATURES.eventStreaming,
  },
  aiProviders: {
    isLocked: (plan) => !plan.aiProvidersEnabled,
    teaser: PLATFORM_FEATURES.aiProviders,
  },
  workerGroups: {
    isLocked: (plan) => !plan.workerGroupsEnabled,
    teaser: PLATFORM_FEATURES.workerGroups,
  },
};

type PlanFeature =
  | 'sso'
  | 'projectRoles'
  | 'globalConnections'
  | 'templates'
  | 'embedding'
  | 'apiKeys'
  | 'secretManagers'
  | 'auditLogs'
  | 'eventStreaming'
  | 'aiProviders'
  | 'workerGroups'
  | 'pieceSets'
  | 'addStepMenu';

type PlanFeatureSampleSpec = {
  isLocked: (plan: PlatformWithoutSensitiveData['plan']) => boolean;
  teaser: PlatformFeature;
};

type PlanFeatureSampleProps = {
  feature: PlanFeature;
  children: React.ReactNode;
};
