import {
  AiToolConfigWithoutSensitiveData,
  CreateAiToolConfigRequest,
  UpdateAiToolConfigRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiToolConfigApi = {
  list() {
    return api.get<AiToolConfigWithoutSensitiveData[]>('/v1/ai-tools');
  },
  upsert(request: CreateAiToolConfigRequest): Promise<void> {
    return api.post('/v1/ai-tools', request);
  },
  update(id: string, request: UpdateAiToolConfigRequest): Promise<void> {
    return api.post(`/v1/ai-tools/${id}`, request);
  },
  delete(id: string): Promise<void> {
    return api.delete(`/v1/ai-tools/${id}`);
  },
};
