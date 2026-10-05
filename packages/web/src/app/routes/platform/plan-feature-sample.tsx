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
      title: 'Single sign-on',
      description:
        "Let people sign in with Google or any SAML 2.0 provider such as Okta or Entra, and limit sign-up to your company's email domains.",
      tier: 'team',
    },
  },
  projectRoles: {
    isLocked: (plan) => !plan.projectRolesEnabled,
    teaser: {
      featureKey: 'CUSTOM_ROLES',
      title: 'Custom roles',
      description:
        "Build a role from individual permissions, like an operator who can retry runs but can't edit flows, and assign it per project.",
      tier: 'team',
    },
  },
  templates: {
    isLocked: (plan) => !plan.manageTemplatesEnabled,
    teaser: {
      featureKey: 'TEMPLATES',
      title: 'Templates',
      description:
        'Turn the flows your teams keep rebuilding into one-click starting points, published to everyone on the platform.',
      tier: 'enterprise',
    },
  },
  embedding: {
    isLocked: (plan) => !plan.embeddingEnabled,
    teaser: {
      featureKey: 'SIGNING_KEYS',
      title: 'Embedding',
      description:
        'Put the flow builder and connections inside your own product with the JS SDK. Your app signs a token, and users and projects are created on first use.',
      tier: 'enterprise',
    },
  },
  apiKeys: {
    isLocked: (plan) => !plan.apiKeysEnabled,
    teaser: {
      featureKey: 'API',
      title: 'API keys',
      description:
        'Create projects, invite people and manage flows from your own scripts or CI. Keys belong to the platform, not to a person.',
      tier: 'team',
    },
  },
  secretManagers: {
    isLocked: (plan) => !plan.secretManagersEnabled,
    teaser: {
      featureKey: 'SECRET_MANAGERS',
      title: 'Secret managers',
      description:
        'Connections read credentials from HashiCorp Vault, AWS, Azure or GCP when a flow runs. Nothing secret is stored here.',
      tier: 'enterprise',
    },
  },
  auditLogs: {
    isLocked: (plan) => !plan.auditLogEnabled,
    teaser: {
      featureKey: 'AUDIT_LOGS',
      title: 'Audit logs',
      description:
        'Every meaningful action on the platform: who did it, when, and what it touched. Filter it, or export it for a security review.',
      tier: 'enterprise',
    },
  },
  pieceSets: {
    isLocked: (plan) => !plan.managePiecesEnabled,
    teaser: {
      featureKey: 'PIECES',
      title: 'Piece policies',
      description:
        'Decide which pieces, and which actions inside them, each project may build with. Projects use the Default policy unless you assign another.',
      tier: 'enterprise',
    },
  },
  eventStreaming: {
    isLocked: (plan) => !plan.eventStreamingEnabled,
    teaser: {
      featureKey: 'EVENT_DESTINATIONS',
      title: 'Event streaming',
      description:
        'Send every audit event to a webhook you own, or handle it in a flow to alert Slack or PagerDuty.',
      tier: 'enterprise',
    },
  },
  aiProviders: {
    isLocked: (plan) => !plan.aiProvidersEnabled,
    teaser: {
      featureKey: 'UNIVERSAL_AI',
      title: 'Unlock AI Center',
      description:
        'Bring your own AI provider keys and choose the models that power your automations',
      tier: 'plus',
    },
  },
  workerGroups: {
    isLocked: (plan) => !plan.workerGroupsEnabled,
    teaser: {
      featureKey: 'DEDICATED_WORKERS',
      title: 'Worker groups',
      description:
        'Give a project its own workers, so a busy project never slows down the rest and sensitive work runs in isolation.',
      tier: 'enterprise',
      documentationUrl:
        'https://www.activepieces.com/docs/install/configure-operate/worker-groups',
    },
  },
};

type PlanFeature =
  | 'sso'
  | 'projectRoles'
  | 'templates'
  | 'embedding'
  | 'apiKeys'
  | 'secretManagers'
  | 'auditLogs'
  | 'eventStreaming'
  | 'aiProviders'
  | 'workerGroups'
  | 'pieceSets';

type PlanFeatureSampleSpec = {
  isLocked: (plan: PlatformWithoutSensitiveData['plan']) => boolean;
  teaser: FeatureTeaserProps;
};

type PlanFeatureSampleProps = {
  feature: PlanFeature;
  children: React.ReactNode;
};
