import { BellIcon, EyeNoneIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { projectApi } from '@/lib/project-api';
import { NotificationStatus, ProjectWithLimits } from '@activepieces/shared';

import { AlertOption } from './alert-option';

const AlertFrequencyCard = React.memo(() => {
  const queryClient = useQueryClient();
  const { project, updateProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  const mutation = useMutation<
    ProjectWithLimits,
    Error,
    {
      notifyStatus: NotificationStatus;
    }
  >({
    mutationFn: (request) => {
      updateProject(queryClient, request);
      return projectApi.update(authenticationSession.getProjectId(), request);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your changes have been saved.',
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
        <CardTitle>Alerts</CardTitle>
        <CardDescription>
          Choose what you want to be notified about.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        <AlertOption
          title="Every Failed Run"
          description="Get an email alert when a flow fails."
          onClick={() => onChangeStatus(NotificationStatus.ALWAYS)}
          icon={<BellIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.ALWAYS}
        />
        <AlertOption
          title="First Seen"
          description="Get an email alert when a new issue created."
          onClick={() => onChangeStatus(NotificationStatus.NEW_ISSUE)}
          icon={<EyeOpenIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.NEW_ISSUE}
        />
        <AlertOption
          title="Never"
          description="Turn off email notifications."
          onClick={() => onChangeStatus(NotificationStatus.NEVER)}
          icon={<EyeNoneIcon className="mt-px size-5" />}
          isActive={project?.notifyStatus === NotificationStatus.NEVER}
        />
      </CardContent>
    </Card>
  );
});

AlertFrequencyCard.displayName = 'AlertFrequencyCard';
export { AlertFrequencyCard };
