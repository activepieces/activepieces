import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';
import { UncategorizedFolderId } from '@activepieces/shared';

import { foldersApi } from './folders-api';

export const foldersHooks = {
  useFolders: () => {
    const folderQuery = useQuery({
      queryKey: ['folders', authenticationSession.getProjectId()],
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
      enabled: folderId !== UncategorizedFolderId,
    });
  },
};
