import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import {
  PlatformPlanLimits,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';

const LICENSE_PROPS_MAP = {
  agentsEnabled: 'Agents Enabled',
  environmentEnabled: 'Team Collaboration via Git',
  analyticsEnabled: 'Analytics',
  auditLogEnabled: 'Audit Log',
  embeddingEnabled: 'Embedding',
  managePiecesEnabled: 'Manage Pieces',
  manageTemplatesEnabled: 'Manage Templates',
  customAppearanceEnabled: 'Brand Activepieces',
  manageProjectsEnabled: 'Manage Projects',
  projectRolesEnabled: 'Project Roles',
  customDomainsEnabled: 'Custom Domains',
  apiKeysEnabled: 'API Keys',
  flowIssuesEnabled: 'Flow Issues',
  alertsEnabled: 'Alerts',
  ssoEnabled: 'Single Sign On',
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
        .map(([key, label]) => {
          const featureEnabled =
            platform?.plan?.[key as keyof PlatformPlanLimits];
          return (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
            >
              <span className="text-sm font-medium">{t(label)}</span>
              {featureEnabled ? (
                <Badge variant="success">{t('Enabled')}</Badge>
              ) : (
                <Badge variant="destructive">{t('Disabled')}</Badge>
              )}
            </div>
          );
        })}
    </div>
  );
};
