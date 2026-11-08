import {
  AiProviderKeyStatus,
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  ModelOptions,
  ModelOptionsSurface,
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
  listModelsForConfig(configId: string) {
    return api.get<AIProviderModel[]>(
      `/v1/ai-providers/configs/${configId}/models`,
    );
  },
  listSuggestedModelsForConfig(configId: string) {
    return api.get<string[]>(
      `/v1/ai-providers/configs/${configId}/suggested-models`,
    );
  },
  listPlatformModelOptions({ surface }: { surface: ModelOptionsSurface }) {
    return api.get<ModelOptions>('/v1/ai-providers/model-options/platform', {
      surface,
    });
  },
  listModelOptions({
    projectId,
    surface,
    tierId,
  }: {
    projectId: string;
    surface: ModelOptionsSurface;
    tierId?: string;
  }) {
    return api.get<ModelOptions>('/v1/ai-providers/model-options', {
      projectId,
      surface,
      ...(tierId === undefined ? {} : { tierId }),
    });
  },
  upsert(request: CreateAIProviderRequest) {
    return api.post<AIProviderWithoutSensitiveData>(
      '/v1/ai-providers',
      request,
    );
  },
  recheck(providerId: string) {
    return api.post<{ status: AiProviderKeyStatus }>(
      `/v1/ai-providers/${providerId}/recheck`,
      {},
    );
  },
  update(providerId: string, request: UpdateAIProviderRequest): Promise<void> {
    return api.post(`/v1/ai-providers/${providerId}`, request);
  },
  delete(providerId: string): Promise<void> {
    return api.delete(`/v1/ai-providers/${providerId}`);
  },
};
