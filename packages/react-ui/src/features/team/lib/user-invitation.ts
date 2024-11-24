import {
  ListUserInvitationsRequest,
  ProjectRole,
  SeekPage,
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
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/user-invitations/${id}`);
  },
  accept(token: string): Promise<{ registered: boolean }> {
    return api.post<{ registered: boolean }>(`/v1/user-invitations/accept`, {
      invitationToken: token,
    });
  },
  listProjectRoles(): Promise<SeekPage<ProjectRole>> {
    return api.get<SeekPage<ProjectRole>>(`/v1/project-roles`);
  },
};
