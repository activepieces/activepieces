import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  FlowAiProviderMigration,
  MigrateFlowsModelRequest,
  SeekPage,
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
  delete(provider: string): Promise<void> {
    return api.delete(`/v1/ai-providers/${provider}`);
  },
  migrateFlows(
    request: MigrateFlowsModelRequest,
  ): Promise<FlowAiProviderMigration> {
    return api.post('/v1/ai-provider-migrations', request);
  },
  getMigration(id: string): Promise<FlowAiProviderMigration> {
    return api.get(`/v1/ai-provider-migrations/${id}`);
  },
  listMigrations(params: {
    cursor?: string;
    limit?: number;
  }): Promise<SeekPage<FlowAiProviderMigration>> {
    return api.get('/v1/ai-provider-migrations', params);
  },
};
