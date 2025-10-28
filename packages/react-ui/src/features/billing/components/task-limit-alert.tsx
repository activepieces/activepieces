import { t } from 'i18next';

import { projectHooks } from '@/hooks/project-hooks';
import { isNil } from '@activepieces/shared';

import { LimitAlert } from './limit-alert';

export const TaskLimitAlert = () => {
  const { project } = projectHooks.useCurrentProject();
  //for ce edition, we don't have plan and usage
  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }
  const taskUsagePercentage = project.usage.tasks / project.plan.tasks;
  return (
    <LimitAlert
      fullUsageWarningNote={t(
        'When a project tasks limit is reached, all flows will be turned off and you will not be able to run any flows.',
      )}
      usagePercentage={taskUsagePercentage}
      getPercentageNote={(limitWarningPercentage) => {
        return `${t('Task Usage Exceeded')} ${
          limitWarningPercentage * 100
        }% ${t('of the Allowed Limit.')} `;
      }}
    />
  );
};

TaskLimitAlert.displayName = 'TaskLimitAlert';
