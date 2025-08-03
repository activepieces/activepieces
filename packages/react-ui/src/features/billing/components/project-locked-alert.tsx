import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useManagePlanDialogStore } from '@/features/billing/components/upgrade-dialog/store';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { ApFlagId, Permission, PlatformRole } from '@activepieces/shared';

import { Button } from '../../../components/ui/button';

export const ProjectLockedAlert = () => {
  const location = useLocation();
  const { project } = projectHooks.useCurrentProject();
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const { checkAccess } = useAuthorization();
  const openDialog = useManagePlanDialogStore((state) => state.openDialog);
  const currentUser = userHooks.useCurrentUser();
  // CE doesn't have a plan
  if (!project.plan?.locked || !location.pathname.startsWith('/project')) {
    return null;
  }
  const showContactAdmin =
    !showBilling && currentUser.data?.platformRole !== PlatformRole.ADMIN;
  const showAdminNote = checkAccess(Permission.WRITE_PROJECT) && !showBilling;
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
                  'You will not be able to access paid features untill limits are increased.',
                )}
              </strong>
              <br />
              {showContactAdmin &&
                t(
                  'Please contact your platform admin to upgrade the plan and unlock this project.',
                )}
              {showAdminNote && (
                <div>
                  <span>{t('Please visit') + ' '}</span>
                  <Link to="/platform/projects" className="underline">
                    {t('Platform Admin')}
                  </Link>{' '}
                  <span>{t('and increase the project limit.')}</span>
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
        <div className="flex flex-col gap-2 relative">
          {showBilling && (
            <Button
              variant="outline"
              className="!text-primary"
              onClick={() => openDialog()}
            >
              {t('Upgrade Plan')}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
