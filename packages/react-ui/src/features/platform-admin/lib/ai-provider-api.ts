import { api } from '@/lib/api';
import {
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
} from '@activepieces/common-ai';
import { SeekPage } from '@activepieces/shared';

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
