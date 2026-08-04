import {
  GetAiRoutingResponse,
  UpsertAiRoutingRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const aiRoutingApi = {
  get() {
    return api.get<GetAiRoutingResponse>('/v1/ai-providers/routing');
  },
  upsert(request: UpsertAiRoutingRequest) {
    return api.post<GetAiRoutingResponse>('/v1/ai-providers/routing', request);
  },
  reset() {
    return api.delete<GetAiRoutingResponse>('/v1/ai-providers/routing');
  },
};
