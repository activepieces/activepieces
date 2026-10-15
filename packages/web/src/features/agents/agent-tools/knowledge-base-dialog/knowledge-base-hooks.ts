import { KnowledgeBaseFile } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { authenticationSession } from '@/lib/authentication-session';
import { validationUtils } from '@/lib/validation-utils';

import { knowledgeBaseApi } from './knowledge-base-api';

export const useKnowledgeBaseFiles = () => {
  const projectId = authenticationSession.getProjectId();
  return useQuery<KnowledgeBaseFile[]>({
    queryKey: ['knowledge-base-files', projectId],
    queryFn: () => knowledgeBaseApi.list(),
  });
};

export const useUploadKnowledgeBaseFile = () => {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  return useMutation<KnowledgeBaseFile, Error, FormData>({
    mutationFn: (formData: FormData) => knowledgeBaseApi.upload(formData),
    onError: (error) => {
      toast.error(uploadErrorMessage(error));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['knowledge-base-files', projectId],
      });
    },
  });
};

export const useDeleteKnowledgeBaseFile = () => {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  return useMutation<void, Error, string>({
    mutationFn: (fileId: string) => knowledgeBaseApi.delete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['knowledge-base-files', projectId],
      });
    },
  });
};

function uploadErrorMessage(error: unknown): string {
  if (validationUtils.isValidationError(error)) {
    switch (error.response?.data?.params?.message) {
      case 'KNOWLEDGE_BASE_NEEDS_AI_PROVIDER':
        return t(
          'Add an AI provider before uploading. Files are indexed when uploaded so agents can search them.',
        );
      case 'KNOWLEDGE_BASE_FILE_HAS_NO_TEXT':
        return t('This file has no text that can be searched.');
    }
  }
  return t('Failed to upload file');
}
