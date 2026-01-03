import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { projectCollection } from '@/hooks/project-collection';
import { api } from '@/lib/api';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

import { FormValues } from '.';

export const useGeneralSettingsMutation = (
  projectId: string,
  form: UseFormReturn<FormValues>,
) => {
  return useMutation<void, Error, UpdateProjectPlatformRequest>({
    mutationFn: async (request) => {
      const tx = await projectCollection.update(projectId, (draft) => {
        if (request.displayName) {
          draft.displayName = request.displayName;
        }
        if (request.icon) {
          draft.icon = request.icon;
        }
        if (request.externalId && request.externalId.trim() !== '') {
          draft.externalId = request.externalId;
        }
      });
      await tx.isPersisted.promise;
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
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
            internalErrorToast();
            break;
          }
        }
      } else {
        console.error(error);
      }
    },
  });
};
