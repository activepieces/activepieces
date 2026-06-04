import {
  EmbedSubdomain,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const embedSubdomainApi = {
  get() {
    return api.get<EmbedSubdomain | null>('/v1/embed-subdomain');
  },
  upsert(request: GenerateEmbedSubdomainRequest) {
    return api.post<EmbedSubdomain>('/v1/embed-subdomain', request);
  },
};
