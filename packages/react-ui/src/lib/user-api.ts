import { UserWithBadges } from '@activepieces/shared';

import { api } from './api';

export const userApi = {
  getUserById(id: string) {
    return api.get<UserWithBadges>(`/v1/users/${id}`);
  },
};
