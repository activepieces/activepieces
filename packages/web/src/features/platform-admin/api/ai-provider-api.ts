import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  ProjectAIProvider,
  UpdateAIProviderRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiProviderApi = {
  listForProject(projectId: string) {
    return api.get<ProjectAIProvider[]>('/v1/ai-providers', { projectId });
  },
  listConfigs() {
    return api.get<AIProviderWithoutSensitiveData[]>(
      '/v1/ai-providers/configs',
    );
  },
  listModelsForProvider(provider: string, projectId: string) {
    return api.get<AIProviderModel[]>(`/v1/ai-providers/${provider}/models`, {
      projectId,
    });
  },
  listModelsForConfig(configId: string) {
    return api.get<AIProviderModel[]>(
      `/v1/ai-providers/configs/${configId}/models`,
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
