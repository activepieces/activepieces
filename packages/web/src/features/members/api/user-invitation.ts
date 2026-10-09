import { SeekPage } from '@activepieces/core-utils';
import {
  ListUserInvitationsRequest,
  SendUserInvitationRequest,
  UserInvitation,
  UserInvitationWithLink,
} from '@activepieces/shared';

import { api } from '../../../lib/api';

export const userInvitationApi = {
  invite: (request: SendUserInvitationRequest) => {
    return api.post<UserInvitationWithLink>('/v1/user-invitations', request);
  },
  list: (request: ListUserInvitationsRequest) => {
    return api.get<SeekPage<UserInvitation>>('/v1/user-invitations', request);
  },
  listAll: (request: Omit<ListUserInvitationsRequest, 'cursor'>) => {
    return listAllPages({ request, cursor: undefined });
  },
  removeProject(id: string) {
    return api.post<UserInvitation>(
      `/v1/user-invitations/${id}/remove-project`,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/user-invitations/${id}`);
  },
  accept(token: string): Promise<{ registered: boolean }> {
    return api.post<{ registered: boolean }>(`/v1/user-invitations/accept`, {
      invitationToken: token,
    });
  },
};

async function listAllPages({
  request,
  cursor,
}: {
  request: Omit<ListUserInvitationsRequest, 'cursor'>;
  cursor: string | undefined;
}): Promise<UserInvitation[]> {
  const page = await api.get<SeekPage<UserInvitation>>('/v1/user-invitations', {
    ...request,
    cursor,
  });
  if (!page.next) {
    return page.data;
  }
  return [
    ...page.data,
    ...(await listAllPages({ request, cursor: page.next })),
  ];
}
