import { t } from 'i18next';
import { Check, Lock } from 'lucide-react';

import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import {
  PlatformPlanLimits,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';

const LICENSE_PROPS_MAP = {
  agentsEnabled: {
    label: 'Agents',
    description: 'AI assistants that can help automate tasks and workflows',
  },
  environmentsEnabled: {
    label: 'Team Collaboration via Git',
    description:
      'Work together on projects with version control and team features',
  },
  analyticsEnabled: {
    label: 'Analytics',
    description: 'View reports and insights about your workflow performance',
  },
  auditLogEnabled: {
    label: 'Audit Log',
    description: 'Track all changes and activities in your workspace',
  },
  embeddingEnabled: {
    label: 'Embedding',
    description: 'Add workflows directly into your website or application',
  },
  globalConnectionsEnabled: {
    label: 'Global Connections',
    description: 'Create centralized connections for your projects',
  },
  managePiecesEnabled: {
    label: 'Manage Pieces',
    description: 'Create and organize custom building blocks for workflows',
  },
  manageTemplatesEnabled: {
    label: 'Manage Templates',
    description: 'Save and share workflow templates across your team',
  },
  customAppearanceEnabled: {
    label: 'Brand Activepieces',
    description: 'Customize the look and feel with your company branding',
  },
  manageProjectsEnabled: {
    label: 'Manage Projects',
    description: 'Organize workflows into separate projects and workspaces',
  },
  projectRolesEnabled: {
    label: 'Project Roles',
    description: 'Control who can view, edit, or manage different projects',
  },
  customDomainsEnabled: {
    label: 'Custom Domains',
    description: 'Use your own web address instead of the default domain',
  },
  apiKeysEnabled: {
    label: 'API Keys',
    description: 'Connect external services and applications to your workflows',
  },
  ssoEnabled: {
    label: 'Single Sign On',
    description: 'Log in using your company account without separate passwords',
  },
  customRolesEnabled: {
    label: 'Custom Roles',
    description: 'Create and manage custom roles for your team',
  },
};

export const FeatureStatus = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(LICENSE_PROPS_MAP)
        .sort(([aKey], [bKey]) => {
          const aEnabled = platform?.plan?.[aKey as keyof PlatformPlanLimits];
          const bEnabled = platform?.plan?.[bKey as keyof PlatformPlanLimits];
          return (aEnabled ? 0 : 1) - (bEnabled ? 0 : 1);
        })
        .map(([key, value]) => {
          const featureEnabled =
            platform?.plan?.[key as keyof PlatformPlanLimits];
          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t(value.label)}</span>
                <span className="text-xs text-muted-foreground">
                  {t(value.description)}
                </span>
              </div>
              {featureEnabled ? (
                <StatusIconWithText
                  icon={Check}
                  text="Enabled"
                  variant="success"
                />
              ) : (
                <StatusIconWithText
                  icon={Lock}
                  text="Upgrade"
                  variant="default"
                />
              )}
            </div>
          );
        })}
    </div>
  );
};
