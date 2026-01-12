// Stub for removed platform-admin feature
import { api } from '@/lib/api';
import { AIProviderWithoutSensitiveData } from '@activepieces/shared';

export const aiProviderApi = {
  list: () => api.get<AIProviderWithoutSensitiveData[]>('/v1/ai/providers'),
  upsert: (_request: unknown) => api.post<void>('/v1/ai/providers', {}),
  update: (_id: string, _request: unknown) =>
    api.post<void>(`/v1/ai/providers/${_id}`, {}),
  delete: (_id: string) => api.delete('/v1/ai/providers'),
};
