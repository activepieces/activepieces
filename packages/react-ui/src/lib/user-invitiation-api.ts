import {
  SendUserInvitationRequest,
  UserInvitationWithLink,
} from '@activepieces/shared';

import { api } from './api';

export const userInvitiationApi = {
  invite: (request: SendUserInvitationRequest) => {
    return api.post<UserInvitationWithLink>('/v1/user-invitations', request);
  },
};
