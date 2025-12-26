import { UserWithMetaInformationAndProject } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getCurrentUser() {
    return api.get<UserWithMetaInformationAndProject>('/v1/users/me');
  },
  getUserById(userId: string) {
    return api.get<UserWithMetaInformationAndProject>(`/v1/users/${userId}`);
  },
};
