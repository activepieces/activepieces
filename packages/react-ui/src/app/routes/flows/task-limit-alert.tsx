import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil } from '@activepieces/shared';

export const TaskLimitAlert = () => {
  const { project } = projectHooks.useCurrentProject();
  //for ce edition, we don't have plan and usage
  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }
  const taskUsagePercentage = project.usage.tasks / project.plan.tasks;
  const type =
    taskUsagePercentage > 0.85
      ? 'destructive'
      : taskUsagePercentage > 0.65
      ? 'warning'
      : null;
  const { data: showBilling } = flagsHooks.useFlag(ApFlagId.SHOW_BILLING);
  if (isNil(type)) return null;
  return (
    <Alert variant={type} className="flex items-center justify-between">
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-grow justify-between items-center">
        <div className="flex-grow">
          <AlertTitle className="mb-2">
            {`${t('Task Usage Exceeded')} ${Number(
              taskUsagePercentage * 100,
            ).toFixed(0)}% `}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>
              {t(
                'If your task limit is exceeded, all flows will be turned off and you will not be able to run any flows.',
              )}
              <br></br>
              {showBilling
                ? t(
                    'Please upgrade your plan so that you can continue running your flows.',
                  )
                : t('Please contact your admin to increase your task limit.')}
            </div>
          </AlertDescription>
        </div>
        {showBilling ? (
          <Link to="/plans">
            <Button variant="outline" size="sm" className="!text-foreground">
              {t('Your Plan')}
            </Button>
          </Link>
        ) : null}
      </div>
    </Alert>
  );
};

export default TaskLimitAlert;
