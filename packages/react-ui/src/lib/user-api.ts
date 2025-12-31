import {
  GetCurrentUserRequestQuery,
  UserWithMetaInformationAndProject,
} from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getCurrentUser(query: GetCurrentUserRequestQuery) {
    return api.get<UserWithMetaInformationAndProject>('/v1/users/me', query);
  },
  getUserById(userId: string) {
    return api.get<UserWithMetaInformationAndProject>(`/v1/users/${userId}`);
  },
};
