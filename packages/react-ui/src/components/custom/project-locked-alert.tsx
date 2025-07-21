import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, Permission } from '@activepieces/shared';

export const ProjectLockedAlert = () => {
  const location = useLocation();
  const { project } = projectHooks.useCurrentProject();
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const { checkAccess } = useAuthorization();

  // CE doesn't have a plan
  if (!project.plan?.locked || !location.pathname.startsWith('/project')) {
    return null;
  }

  return (
    <Alert
      variant="default"
      className="flex items-center justify-between relative mb-4"
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-grow justify-between items-center">
        <div className="flex-grow">
          <AlertTitle className="mb-2">Project is locked</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>
              {t(
                'This project has been locked because your platform has reached the maximum number of allowed projects.',
              )}{' '}
              <strong>
                {t(
                  'You will not be able to access paied features untill limits are increased.',
                )}
              </strong>
              <br />
              {showBilling ? (
                <div>
                  <span>{t('Please visit')} </span>
                  <Link to="/platform/setup/billing" className="underline">
                    {t('Your Plan')}
                  </Link>{' '}
                  <span>{t('to upgrade and unlock project access.')}</span>
                </div>
              ) : !checkAccess(Permission.WRITE_PROJECT) ? (
                t(
                  'Please contact your platform admin to upgrade the plan and unlock this project.',
                )
              ) : (
                <div>
                  <span>
                    {t(
                      'To resolve this, go to please contact ur platform admin',
                    )}{' '}
                  </span>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
