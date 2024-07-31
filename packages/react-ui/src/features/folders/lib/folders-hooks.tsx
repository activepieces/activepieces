import { useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { foldersApi } from './folders-api';

export const foldersHooks = {
  useFolders: () => {
    return useQuery({
      queryKey: ['folders', authenticationSession.getProjectId()],
      queryFn: foldersApi.list,
    });
  },
};
