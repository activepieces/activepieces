import { BellIcon, EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Bell, Trash } from 'lucide-react';
import React from 'react';

import { AddAlertEmailDialog } from '@/app/routes/settings/alerts/add-alert-email-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  alertQueries,
  alertMutations,
} from '@/features/alerts/lib/alert-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import { cn } from '@/lib/utils';
import { Alert } from '@activepieces/ee-shared';
import {
  Permission,
  ProjectWithLimits,
  NotificationStatus,
} from '@activepieces/shared';

const AlertOption = ({
  title,
  description,
  onClick,
  icon,
  isActive,
  disabled,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
  isActive: boolean;
  disabled: boolean;
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex items-center gap-3 p-4 h-auto justify-start w-full rounded-lg border transition-all',
      isActive
        ? 'bg-muted border-primary text-primary'
        : 'border-border hover:border-primary/30 hover:bg-muted',
    )}
  >
    <div className="shrink-0">{icon}</div>
    <div className="text-left">
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </div>
    </div>
    {isActive && <Check className="w-4 h-4 ml-auto mt-1 text-primary" />}
  </Button>
);

export const AlertsSettings = () => {
  const { project, updateCurrentProject } = projectHooks.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

  const notificationMutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      notifyStatus: NotificationStatus;
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId()!, request);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
  });

  const onChangeStatus = (status: NotificationStatus) => {
    notificationMutation.mutate({
      notifyStatus: status,
    });
  };

  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Alert Frequency')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Choose what you want to be notified about.')}
          </CardDescription>
          {writeAlertPermission === false && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-700">
                <span className="font-medium">⚠️ Limited Access:</span>{' '}
                {t(
                  'Project and alert permissions are required to change this setting.',
                )}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <AlertOption
            title={t('Every Failed Run')}
            description={t('Get an email alert when a flow fails.')}
            onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
            icon={<BellIcon className="w-4 h-4" />}
            isActive={project?.notifyStatus === NotificationStatus.ALWAYS}
            disabled={writeAlertPermission === false}
          />
          <AlertOption
            title={t('First Seen')}
            description={t('Get an email alert when a new issue is created.')}
            onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
            icon={<EyeOpenIcon className="w-4 h-4" />}
            isActive={project?.notifyStatus === NotificationStatus.NEW_ISSUE}
            disabled={writeAlertPermission === false}
          />
          <AlertOption
            title={t('Never')}
            description={t('Turn off email notifications.')}
            onClick={() => onChangeStatus(NotificationStatus.NEVER)}
            icon={<EyeNoneIcon className="w-4 h-4" />}
            isActive={project?.notifyStatus === NotificationStatus.NEVER}
            disabled={writeAlertPermission === false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {t('Alert Emails')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('Add email addresses to receive alerts.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="min-h-[100px]">
            {alertsLoading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner className="w-6 h-6" />
              </div>
            )}
            {alertsError && (
              <div className="text-center text-destructive py-8 text-sm">
                {t('Error, please try again.')}
              </div>
            )}
            {alertsData && alertsData.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                {t('No emails added yet.')}
              </div>
            )}
            <div className="space-y-2">
              {Array.isArray(alertsData) &&
                alertsData.map((alert: Alert) => (
                  <div
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-all"
                    key={alert.id}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                        <Bell className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {alert.receiver}
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          onClick={() => deleteAlert(alert)}
                          disabled={writeAlertPermission === false}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      {writeAlertPermission === false && (
                        <TooltipContent side="bottom">
                          {t('Only project admins can do this')}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                ))}
            </div>
          </div>
          <AddAlertEmailDialog />
        </CardContent>
      </Card>
    </>
  );
};
