import { BellIcon, EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import {
  NotificationStatus,
  Permission,
  ProjectWithLimits,
} from '@activepieces/shared';

import { AlertOption } from './alert-option';

const AlertFrequencyCard = React.memo(() => {
  const queryClient = useQueryClient();
  const { project, updateProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();
  const { checkAccess } = useAuthorization();
  const writeAlertPermission = checkAccess(Permission.WRITE_ALERT);
  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      notifyStatus: NotificationStatus;
    }
  >({
    mutationFn: (request) => {
      updateProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId()!, request);
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: (error) => {
      toast(INTERNAL_ERROR_TOAST);
      console.log(error);
    },
  });

  const onChangeStatus = (status: NotificationStatus) => {
    mutation.mutate({
      notifyStatus: status,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>{t('Alerts')}</CardTitle>
        <CardDescription>
          {t('Choose what you want to be notified about.')}
        </CardDescription>
        {writeAlertPermission === false && (
          <p>
            <span className="text-destructive">*</span>{' '}
            {t('Only project admins can change this setting.')}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid gap-1">
        <AlertOption
          title={t('Every Failed Run')}
          description={t('Get an email alert when a flow fails.')}
          onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
          icon={<BellIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.ALWAYS}
          disabled={writeAlertPermission === false}
        />
        <AlertOption
          title={t('First Seen')}
          description={t('Get an email alert when a new issue created.')}
          onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
          icon={<EyeOpenIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.NEW_ISSUE}
          disabled={writeAlertPermission === false}
        />
        <AlertOption
          title={t('Never')}
          description={t('Turn off email notifications.')}
          onClick={() => onChangeStatus(NotificationStatus.NEVER)}
          icon={<EyeNoneIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.NEVER}
          disabled={writeAlertPermission === false}
        />
      </CardContent>
    </Card>
  );
});

AlertFrequencyCard.displayName = 'AlertFrequencyCard';
export { AlertFrequencyCard };
