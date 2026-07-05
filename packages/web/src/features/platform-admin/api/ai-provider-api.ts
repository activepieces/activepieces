import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  DiscoverAIProviderModelsRequest,
  UpdateAIProviderRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiProviderApi = {
  list() {
    return api.get<AIProviderWithoutSensitiveData[]>('/v1/ai-providers');
  },
  listModelsForProvider(provider: string) {
    return api.get<AIProviderModel[]>(`/v1/ai-providers/${provider}/models`);
  },
  discoverModels(provider: string, request: DiscoverAIProviderModelsRequest) {
    return api.post<AIProviderModel[]>(
      `/v1/ai-providers/${provider}/models/discover`,
      request,
    );
  },
  upsert(request: CreateAIProviderRequest): Promise<void> {
    return api.post('/v1/ai-providers', request);
  },
  update(providerId: string, request: UpdateAIProviderRequest): Promise<void> {
    return api.post(`/v1/ai-providers/${providerId}`, request);
  },
  delete(provider: string): Promise<void> {
    return api.delete(`/v1/ai-providers/${provider}`);
  },
};
