import { api } from '@/lib/api';
import {
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@activepieces/shared';

export const aiProviderApi = {
  list: () => api.get<AIProviderWithoutSensitiveData[]>('/v1/ai-providers'),
  create: (request: CreateAIProviderRequest) =>
    api.post<AIProviderWithoutSensitiveData>('/v1/ai-providers', request),
  update: (id: string, request: UpdateAIProviderRequest) =>
    api.post<AIProviderWithoutSensitiveData>(`/v1/ai-providers/${id}`, request),
  delete: (id: string) => api.delete<void>(`/v1/ai-providers/${id}`),
};
