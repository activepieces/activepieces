import {
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiProviderApi = {
  list() {
    return api.get<SeekPage<AIProviderWithoutSensitiveData>>(
      '/v1/ai-providers',
    );
  },
  upsert(request: CreateAIProviderRequest): Promise<void> {
    return api.post('/v1/ai-providers', request);
  },
  delete(provider: string) {
    return api.delete(`/v1/ai-providers/${provider}`);
  },
};
