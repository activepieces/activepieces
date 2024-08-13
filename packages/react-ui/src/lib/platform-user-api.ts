import { SeekPage, UpdateUserRequestBody, User } from '@activepieces/shared';

import { api } from './api';

export const platformUserApi = {
  list() {
    return api.get<SeekPage<User>>('/v1/users');
  },
  delete(id: string) {
    return api.delete(`/v1/users/${id}`);
  },
  update(id: string, request: UpdateUserRequestBody) {
    return api.post(`/v1/users/${id}`, request);
  },
};
