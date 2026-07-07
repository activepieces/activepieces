import {
  PlatformPieceFilter,
  UpdatePlatformPieceFilterRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformPieceFilterApi = {
  get() {
    return api.get<PlatformPieceFilter>('/v1/platform-piece-filter');
  },
  update(request: UpdatePlatformPieceFilterRequestBody) {
    return api.post<PlatformPieceFilter>('/v1/platform-piece-filter', request);
  },
};
