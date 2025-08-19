import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useManagePlanDialogStore } from '@/features/billing/components/upgrade-dialog/store';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { ApFlagId, isNil, Permission } from '@activepieces/shared';
const WARNING_PERCENTAGE = 0.65;
const DESTRUCTIVE_PERCENTAGE = 0.85;

type LimitAlertProps = {
  fullUsageWarningNote: ReactNode;
  /**between 0 and 1 */
  usagePercentage: number;
  getPercentageNote: (limitWarningPercentage: number) => ReactNode;
};

export const LimitAlert = ({
  fullUsageWarningNote,
  usagePercentage,
  getPercentageNote,
}: LimitAlertProps) => {
  const { data: showBilling } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  const { project } = projectHooks.useCurrentProject();
  const openDialog = useManagePlanDialogStore((state) => state.openDialog);
  const { checkAccess } = useAuthorization();
  const [isProjectSettingsDialogOpen, setIsProjectSettingsDialogOpen] =
    useState(false);
  const getAlertType = (usagePercentage: number) => {
    if (
      usagePercentage > WARNING_PERCENTAGE &&
      usagePercentage < DESTRUCTIVE_PERCENTAGE
    ) {
      return 'warning';
    }
    if (usagePercentage >= DESTRUCTIVE_PERCENTAGE) {
      return 'destructive';
    }
    return null;
  };
  const type = getAlertType(usagePercentage);
  const getLimitPercentage = () => {
    switch (type) {
      case 'destructive':
        return DESTRUCTIVE_PERCENTAGE;
      case 'warning':
        return WARNING_PERCENTAGE;
      default:
        return 0;
    }
  };
  if (isNil(type)) return null;
  const showContactAdmin =
    !checkAccess(Permission.WRITE_PROJECT) && !showBilling;
  const showAdminNote = checkAccess(Permission.WRITE_PROJECT) && !showBilling;
  return (
    <Alert
      variant={type}
      className="flex items-center justify-between relative mb-4"
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex flex-grow justify-between items-center">
        <div className="flex-grow">
          <AlertTitle className="mb-2">
            {getPercentageNote(getLimitPercentage())}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>
              {fullUsageWarningNote}
              <br></br>
              {showContactAdmin &&
                t('Please contact your admin to increase the project limit.')}
              {showAdminNote && (
                <div>
                  <span>{t('Please check your') + ' '}</span>
                  <span
                    className="underline cursor-pointer"
                    onClick={() => setIsProjectSettingsDialogOpen(true)}
                  >
                    {t('Project Settings')}
                  </span>{' '}
                  <span>{t('and increase the limit.')}</span>
                  <EditProjectDialog
                    open={isProjectSettingsDialogOpen}
                    onClose={() => setIsProjectSettingsDialogOpen(false)}
                    projectId={project?.id}
                    initialValues={{
                      projectName: project?.displayName,
                      tasks: project?.plan?.tasks?.toString() ?? '',
                      aiCredits: project?.plan?.aiCredits?.toString() ?? '',
                    }}
                  />
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
