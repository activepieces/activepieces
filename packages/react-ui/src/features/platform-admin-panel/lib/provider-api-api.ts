import { api } from '@/lib/api';
import {
  AiProviderConfig,
  SeekPage
} from '@activepieces/shared';

export const aiProviderApi = {
  list() {
    return api.get<SeekPage<AiProviderConfig>>('/v1/ai-providers');
  },
  upsert(request: AiProviderConfig) { 
    return api.post<AiProviderConfig>('/v1/ai-providers', request);
  },
  delete(provider: string) {
    return api.delete(`/v1/ai-providers/${provider}`);
  }
};
