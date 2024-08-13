import { useQuery } from '@tanstack/react-query';

import { foldersApi } from './folders-api';

import { authenticationSession } from '@/lib/authentication-session';

export const foldersHooks = {
  useFolders: () => {
    const folderQuery = useQuery({
      queryKey: ['folders', authenticationSession.getProjectId()],
      queryFn: foldersApi.list,
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
