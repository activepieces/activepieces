import { t } from 'i18next';

import { projectHooks } from '@/hooks/project-hooks';
import { isNil } from '@activepieces/shared';

import { LimitAlert } from './limit-alert';

export const AiCreditsLimitAlert = () => {
  const { project } = projectHooks.useCurrentProject();
  //for ce edition, we don't have plan and usage
  if (isNil(project?.plan?.aiCredits) || isNil(project?.usage?.aiCredits)) {
    return null;
  }
  const aiCreditsUsagePercentage =
    project.usage.aiCredits / project.plan.aiCredits;
  return (
    <LimitAlert
      fullUsageWarningNote={t(
        'When a project AI credits limit is reached, all flows using universal AI pieces or agents and MCP servers will fail.',
      )}
      usagePercentage={aiCreditsUsagePercentage}
      getPercentageNote={(limitWarningPercentage) => {
        return `${t('AI Credits Usage Exceeded')} ${
          limitWarningPercentage * 100
        }% ${t('of the Allowed Limit.')} `;
      }}
    />
  );
};

AiCreditsLimitAlert.displayName = 'AiCreditsLimitAlert';
