import { useQuery } from '@tanstack/react-query';

import { foldersApi } from './folders-api';

import { authenticationSession } from '@/lib/authentication-session';

export const foldersHooks = {
  useFolders: () => {
    return useQuery({
      queryKey: ['folders', authenticationSession.getProjectId()],
      queryFn: foldersApi.list,
    });
  },
};
