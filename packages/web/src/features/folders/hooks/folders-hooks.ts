import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { foldersApi } from '../api/folders-api';

export const foldersHooks = {
  useFolders: () => {
    const folderQuery = useQuery({
      queryKey: ['folders', authenticationSession.getProjectId()],
      queryFn: () => foldersApi.list(),
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
    return {
      folders: folderQuery.data,
      isLoading: folderQuery.isLoading,
      refetch: folderQuery.refetch,
    };
  },
  useFolder: (folderId: string) => {
    return useQuery({
      queryKey: ['folder', folderId],
      queryFn: () => foldersApi.get(folderId),
      enabled: folderId !== UncategorizedFolderId,
    });
  },
};

export const foldersMutations = {
  useRenameFolder: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError?: (error: unknown) => void;
  }) => {
    return useMutation({
      mutationFn: async ({
        folderId,
        displayName,
      }: {
        folderId: string;
        displayName: string;
      }) => {
        return await foldersApi.renameFolder(folderId, { displayName });
      },
      onSuccess,
      onError,
    });
  },
  useCreateFolder: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (folder: FolderDto) => void;
    onError?: (error: unknown) => void;
  }) => {
    return useMutation<FolderDto, Error, { displayName: string }>({
      mutationFn: async (data) => {
        return await foldersApi.create({
          displayName: data.displayName.trim(),
          projectId: authenticationSession.getProjectId()!,
        });
      },
      onSuccess,
      onError,
    });
  },
};
