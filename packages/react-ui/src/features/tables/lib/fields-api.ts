import { api } from '@/lib/api';
import {
  CreateFieldRequest,
  Field,
  UpdateFieldRequest,
} from '@activepieces/shared';

export const fieldsApi = {
  list(tableId: string): Promise<Field[]> {
    return api.get<Field[]>('/v1/fields', { tableId });
  },

  create(request: CreateFieldRequest): Promise<Field> {
    return api.post<Field>('/v1/fields', request);
  },

  getById(id: string): Promise<Field> {
    return api.get<Field>(`/v1/fields/${id}`);
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/fields/${id}`);
  },

  update(id: string, request: UpdateFieldRequest): Promise<Field> {
    return api.post<Field>(`/v1/fields/${id}`, request);
  },
};
