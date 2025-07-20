import { useQuery } from '@tanstack/react-query';

import { useEmbedding } from '@/components/embed-provider';
import { projectMembersApi } from '@/features/team/lib/project-members-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  AppConnectionOwners,
  AppConnectionWithoutSensitiveData,
  isNil,
  ListAppConnectionsRequestQuery,
} from '@activepieces/shared';

import { appConnectionsApi } from './app-connections-api';

export const appConnectionsHooks = {
  useConnections: (
    request: Omit<ListAppConnectionsRequestQuery, 'projectId'>,
  ) => {
    const projectId = authenticationSession.getProjectId() ?? '';
    if (projectId === '') {
      console.error(
        'trying to use projectId when the authentication session is not set',
      );
    }
    return useQuery<AppConnectionWithoutSensitiveData[]>({
      queryKey: ['app-connections', request.pieceName, projectId],
      queryFn: async () => {
        const localConnections = await appConnectionsApi.list({
          ...request,
          projectId,
        });
        return [...localConnections.data];
      },
      staleTime: 0,
    });
  },
  useConnectionsOwners: () => {
    const projectId = authenticationSession.getProjectId() ?? '';
    const isEmbedding = useEmbedding().embedState.isEmbedded;
    if (projectId === '') {
      console.error(
        'trying to use projectId when the authentication session is not set',
      );
    }
    return useQuery<AppConnectionOwners[]>({
      queryKey: ['app-connections-owners', projectId],
      queryFn: async () => {
        const { data: owners } = await appConnectionsApi.getOwners({
          projectId,
        });
        const { data: projectMembers } = await projectMembersApi.list({
          projectId,
        });
        if (isEmbedding) {
          return owners.filter(
            (owner) =>
              !isNil(
                projectMembers.find(
                  (member) => member.user.email === owner.email,
                ),
              ),
          );
        }

        return [...owners];
      },
    });
  },
};
