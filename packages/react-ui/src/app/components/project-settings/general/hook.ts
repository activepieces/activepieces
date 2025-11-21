import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectHooks } from '@/hooks/project-hooks';
import { api } from '@/lib/api';
import { projectApi } from '@/lib/project-api';
import {
  ApErrorParams,
  ErrorCode,
  ProjectIcon,
  ProjectWithLimits,
} from '@activepieces/shared';

import { FormValues } from '.';

export const useGeneralSettingsMutation = (
  projectId: string,
  form: UseFormReturn<FormValues>,
) => {
  const queryClient = useQueryClient();
  const { updateCurrentProject } = projectHooks.useCurrentProject();
  const { toast } = useToast();

  return useMutation<
    ProjectWithLimits,
    Error,
    {
      displayName: string;
      icon: ProjectIcon;
      externalId?: string;
      plan: { aiCredits?: number | undefined };
    }
  >({
    mutationFn: (request) => {
      updateCurrentProject(queryClient, request);
      return projectApi.update(projectId!, {
        ...request,
        externalId:
          request.externalId?.trim() !== '' ? request.externalId : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
      queryClient.invalidateQueries({
        queryKey: ['current-project'],
      });
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        switch (apError.code) {
          case ErrorCode.PROJECT_EXTERNAL_ID_ALREADY_EXISTS: {
            form.setError('root.serverError', {
              message: t('The external ID is already taken.'),
            });
            break;
          }
          default: {
            toast(INTERNAL_ERROR_TOAST);
            break;
          }
        }
      }
    },
  });
};
