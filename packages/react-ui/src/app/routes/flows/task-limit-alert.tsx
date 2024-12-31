import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { CloseTaskLimitAlertContext } from '@/app/components/dashboard-container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil, Permission } from '@activepieces/shared';

const WARNING_PERCENTAGE = 0.65;
const DESTRUCTIVE_PERCENTAGE = 0.85;
export const TaskLimitAlert = () => {
  const { project } = projectHooks.useCurrentProject();
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const { isAlertClosed, setIsAlertClosed } = useContext(
    CloseTaskLimitAlertContext,
  );
  const { checkAccess } = useAuthorization();
  //for ce edition, we don't have plan and usage
  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }

  const taskUsagePercentage = project.usage.tasks / project.plan.tasks;
  const type =
    taskUsagePercentage > WARNING_PERCENTAGE &&
    taskUsagePercentage < DESTRUCTIVE_PERCENTAGE
      ? 'warning'
      : taskUsagePercentage >= DESTRUCTIVE_PERCENTAGE
      ? 'destructive'
      : null;
  const limitPercentage =
    type === 'destructive'
      ? DESTRUCTIVE_PERCENTAGE
      : type === 'warning'
      ? WARNING_PERCENTAGE
      : 0;
  if (isNil(type)) return null;
  if (isAlertClosed && type !== 'destructive') return null;
  return (
    <Alert
      variant={type}
      className="flex items-center justify-between relative"
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-grow justify-between items-center">
        <div className="flex-grow">
          <AlertTitle className="mb-2">
            {taskUsagePercentage === 1
              ? t('All Flows Are Turned Off')
              : `${t('Task Usage Exceeded')} ${limitPercentage * 100}% ${t(
                  'of the Allowed Limit.',
                )} `}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>
              {t(`When a project tasks limit is reached,`)}{' '}
              <strong>
                {t(
                  'all flows will be turned off and you will not be able to run any flows.',
                )}
              </strong>
              <br></br>
              {showBilling ? (
                <div>
                  <span>{t('Please visit') + ' '}</span>
                  <Link to="/plans" className="underline">
                    {t('Your Plan')}
                  </Link>{' '}
                  <span>
                    {t(
                      'and increase your task limit, which requires your payment details.',
                    )}
                  </span>
                </div>
              ) : !checkAccess(Permission.WRITE_PROJECT) ? (
                t(
                  'Please contact your admin to increase the project task limit.',
                )
              ) : (
                <div>
                  <span>{t('Please visit') + ' '}</span>
                  <Link to="/settings/general" className="underline">
                    {t('Project Settings')}
                  </Link>{' '}
                  <span>{t('and increase the project task limit.')}</span>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
        <div className="flex flex-col gap-2">
          {type === 'warning' ? (
            <Button
              variant="ghost"
              className="!text-foreground"
              size="sm"
              onClick={() => {
                setIsAlertClosed(true);
              }}
            >
              {t('Dismiss')}
            </Button>
          ) : null}
        </div>
      </div>
    </Alert>
  );
};

export default TaskLimitAlert;
