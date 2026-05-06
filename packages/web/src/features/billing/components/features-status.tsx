import {
  PlatformPlanLimits,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Lock } from 'lucide-react';

const LICENSE_PROPS_MAP = {
  environmentsEnabled: {
    label: 'Team Collaboration via Git',
  },
  analyticsEnabled: {
    label: 'Analytics',
  },
  auditLogEnabled: {
    label: 'Audit Log',
  },
  embeddingEnabled: {
    label: 'Embedding',
  },
  globalConnectionsEnabled: {
    label: 'Global Connections',
  },
  managePiecesEnabled: {
    label: 'Manage Pieces',
  },
  manageTemplatesEnabled: {
    label: 'Manage Templates',
  },
  customAppearanceEnabled: {
    label: 'Brand Activepieces',
  },
  teamProjectsLimit: {
    label: 'Team Projects Limit',
  },
  projectRolesEnabled: {
    label: 'Project Roles',
  },
  customDomainsEnabled: {
    label: 'Custom Domains',
  },
  apiKeysEnabled: {
    label: 'API Keys',
  },
  ssoEnabled: {
    label: 'Single Sign On',
  },
  customRolesEnabled: {
    label: 'Custom Roles',
  },
  eventStreamingEnabled: {
    label: 'Event Streaming',
  },
  scimEnabled: {
    label: 'SCIM',
  },
  secretManagersEnabled: {
    label: 'Secret Managers',
  },
  agentsEnabled: {
    label: 'AI & Agents',
  },
  aiProvidersEnabled: {
    label: 'AI Providers',
  },
};

export const FeatureStatus = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
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
            <div key={key} className="flex items-center gap-2">
              {featureEnabled ? (
                <Check className="size-4 text-success shrink-0" />
              ) : (
                <Lock className="size-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-sm ${
                  featureEnabled ? '' : 'text-muted-foreground'
                }`}
              >
                {t(value.label)}
              </span>
            </div>
          );
        })}
    </div>
  );
};
