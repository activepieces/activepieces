import { api } from '@/lib/api';
import { CreateRbacRequestBody, UpdateRbacRequestBody, Rbac, SeekPage } from '@activepieces/shared';

export const rbacApi = {
  async list() {
    return await api.get<SeekPage<Rbac>>(`/v1/rbac`);
  },

  async create(requestBody: CreateRbacRequestBody) {
    return await api.post<Rbac>('/v1/rbac', requestBody);
  },

  async update(id: string, requestBody: UpdateRbacRequestBody) {
    return await api.post<Rbac>(`/v1/rbac/${id}`, requestBody);
  },

  async delete(id: string) {
    return await api.delete<void>(`/v1/rbac/${id}`);
  },
};
