import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  FlowMigration,
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
  migrateFlows(request: MigrateFlowsModelRequest): Promise<FlowMigration> {
    return api.post('/v1/flow-migrations', request);
  },
  getMigration(id: string): Promise<FlowMigration> {
    return api.get(`/v1/flow-migrations/${id}`);
  },
  listMigrations(params: {
    cursor?: string;
    limit?: number;
  }): Promise<SeekPage<FlowMigration>> {
    return api.get('/v1/flow-migrations', params);
  },
};
