import { api } from '@/lib/api';
import {
  SeekPage,
  UpdateUserRequestBody,
  User,
  UserWithMetaInformation,
  ListUsersRequestBody,
} from '@activepieces/shared';

export const platformUserApi = {
  list(request: ListUsersRequestBody) {
    return api.get<SeekPage<UserWithMetaInformation>>('/v1/users', request);
  },
  delete(id: string) {
    return api.delete(`/v1/users/${id}`);
  },
  update(id: string, request: UpdateUserRequestBody): Promise<User> {
    return api.post<User>(`/v1/users/${id}`, request);
  },
};
