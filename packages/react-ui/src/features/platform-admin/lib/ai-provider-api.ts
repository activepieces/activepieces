import { api } from '@/lib/api';
import {
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@activepieces/shared';

export const aiProviderApi = {
  list() {
    return api.get<AIProviderWithoutSensitiveData[]>('/v1/ai-providers');
  },
  upsert(request: CreateAIProviderRequest): Promise<void> {
    return api.post('/v1/ai-providers', request);
  },
  update(providerId: string, request: UpdateAIProviderRequest): Promise<void> {
    return api.post(`/v1/ai-providers/${providerId}`, request);
  },
  delete(provider: string) {
    return api.delete(`/v1/ai-providers/${provider}`);
  },
};
