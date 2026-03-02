import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  MigrateFlowsModelRequest,
  MigrateFlowsModelResponse,
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
  upsert(request: CreateAIProviderRequest): Promise<void> {
    return api.post('/v1/ai-providers', request);
  },
  update(providerId: string, request: UpdateAIProviderRequest): Promise<void> {
    return api.post(`/v1/ai-providers/${providerId}`, request);
  },
  delete(provider: string) {
    return api.delete(`/v1/ai-providers/${provider}`);
  },
  migrateFlows(
    request: MigrateFlowsModelRequest,
  ): Promise<MigrateFlowsModelResponse> {
    return api.post('/v1/flows/versions/migrate-ai-model', request);
  },
};
