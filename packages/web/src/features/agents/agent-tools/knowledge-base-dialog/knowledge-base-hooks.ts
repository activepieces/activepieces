import { KnowledgeBaseFile } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

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
