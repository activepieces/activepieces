import { useQuery, useQueryClient } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { foldersApi } from './folders-api';

const folderListQueryKey = ['folders', authenticationSession.getProjectId()];

export const foldersHooks = {
  folderListQueryKey,
  useQueryClient: null as any,

  useFolders: () => {
    foldersHooks.useQueryClient = useQueryClient();

    const folderQuery = useQuery({
      queryKey: folderListQueryKey,
      queryFn: () => foldersApi.list(),
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
      enabled: folderId !== 'NULL',
    });
  },
};
