import { api } from '@/lib/api';
import { SeekPage, UpdateUserRequestBody, User } from '@activepieces/shared';

export const platformUserApi = {
  list() {
    return api.get<SeekPage<User>>('/v1/users');
  },
  delete(id: string) {
    return api.delete(`/v1/users/${id}`);
  },
  update(id: string, request: UpdateUserRequestBody): Promise<User> {
    return api.post<User>(`/v1/users/${id}`, request);
  },
};
