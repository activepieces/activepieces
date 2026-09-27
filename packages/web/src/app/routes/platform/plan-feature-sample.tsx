import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import React from 'react';

import { FeatureSample } from '@/app/components/feature-sample';
import { FeatureTeaserProps } from '@/app/components/feature-teaser';
import { platformHooks } from '@/hooks/platform-hooks';

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
      showContactSales={teaser.showContactSales}
    >
      {children}
    </FeatureSample>
  );
}

const PLAN_FEATURE_SAMPLES: Record<PlanFeature, PlanFeatureSampleSpec> = {
  sso: {
    isLocked: (plan) => !plan.ssoEnabled,
    teaser: {
      featureKey: 'SSO',
      title: 'Enable Single Sign On',
      description:
        'Let your users sign in with your current SSO provider or give them self serve sign up access',
      tier: 'team',
    },
  },
  projectRoles: {
    isLocked: (plan) => !plan.projectRolesEnabled,
    teaser: {
      featureKey: 'CUSTOM_ROLES',
      title: 'Enable Custom Roles',
      description:
        'Define custom roles and permissions to control what your team members can access and modify',
      tier: 'team',
    },
  },
  globalConnections: {
    isLocked: (plan) => !plan.globalConnectionsEnabled,
    teaser: {
      featureKey: 'GLOBAL_CONNECTIONS',
      title: 'Enable Global Connections',
      description: 'Manage platform-wide connections to external systems.',
      tier: 'team',
    },
  },
  templates: {
    isLocked: (plan) => !plan.manageTemplatesEnabled,
    teaser: {
      featureKey: 'TEMPLATES',
      title: 'Unlock Templates',
      description:
        'Convert the most common automations into reusable templates 1 click away from your users',
      tier: 'enterprise',
    },
  },
  embedding: {
    isLocked: (plan) => !plan.embeddingEnabled,
    teaser: {
      featureKey: 'SIGNING_KEYS',
      title: 'Unlock Embedding Through JS SDK',
      description: 'Enable signing keys to access embedding functionalities.',
      tier: 'enterprise',
    },
  },
  apiKeys: {
    isLocked: (plan) => !plan.apiKeysEnabled,
    teaser: {
      featureKey: 'API',
      title: 'Enable API Keys',
      description: 'Create and manage API keys to access Activepieces APIs.',
      tier: 'team',
    },
  },
  secretManagers: {
    isLocked: (plan) => !plan.secretManagersEnabled,
    teaser: {
      featureKey: 'SECRET_MANAGERS',
      title: 'Enable Secret Managers',
      description: 'Manage your secrets from a single and secure place',
      tier: 'enterprise',
    },
  },
  auditLogs: {
    isLocked: (plan) => !plan.auditLogEnabled,
    teaser: {
      featureKey: 'AUDIT_LOGS',
      title: 'Unlock Audit Logs',
      description:
        'Comply with internal and external security policies by tracking activities done within your account',
      tier: 'enterprise',
    },
  },
  eventStreaming: {
    isLocked: (plan) => !plan.eventStreamingEnabled,
    teaser: {
      featureKey: 'EVENT_DESTINATIONS',
      title: 'Unlock Event Streaming',
      description:
        'Forward every audit event we emit to a webhook, then handle it in a flow.',
      tier: 'enterprise',
    },
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
  | 'eventStreaming';

type PlanFeatureSampleSpec = {
  isLocked: (plan: PlatformWithoutSensitiveData['plan']) => boolean;
  teaser: FeatureTeaserProps;
};

type PlanFeatureSampleProps = {
  feature: PlanFeature;
  children: React.ReactNode;
};
