import {
  CreatePlatformModelTierRequest,
  PlatformModelTier,
  UpdatePlatformModelTierRequest,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformModelTierApi = {
  listAdmin() {
    return api.get<PlatformModelTier[]>('/v1/platform-model-tiers/admin');
  },
  create(request: CreatePlatformModelTierRequest) {
    return api.post<PlatformModelTier>('/v1/platform-model-tiers', request);
  },
  update({
    id,
    request,
  }: {
    id: string;
    request: UpdatePlatformModelTierRequest;
  }) {
    return api.post<PlatformModelTier>(
      `/v1/platform-model-tiers/${id}`,
      request,
    );
  },
  reorder({ tierIds }: { tierIds: string[] }) {
    return api.post<PlatformModelTier[]>('/v1/platform-model-tiers/reorder', {
      tierIds,
    });
  },
  remove({ id, replacedBy }: { id: string; replacedBy?: string }) {
    return api.delete<void>(
      `/v1/platform-model-tiers/${id}`,
      replacedBy === undefined ? undefined : { replacedBy },
    );
  },
};
