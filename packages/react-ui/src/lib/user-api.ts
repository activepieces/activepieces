import { UserWithMetaInformation } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getUserById(id: string) {
    return api.get<UserWithMetaInformation>(`/v1/users/${id}`);
  },
};
