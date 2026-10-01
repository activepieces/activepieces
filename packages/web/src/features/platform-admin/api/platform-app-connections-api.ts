import { SeekPage } from '@activepieces/core-utils';
import {
  AppConnectionWithoutSensitiveData,
  ListPlatformAppConnectionsRequestQuery,
  PlatformAppConnectionOwnersResponse,
  PlatformAppConnectionsListItem,
  PlatformAppConnectionsSummary,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const platformAppConnectionsApi = {
  list(request: ListPlatformAppConnectionsRequestQuery) {
    return api.get<SeekPage<PlatformAppConnectionsListItem>>(
      '/v1/platform-app-connections',
      request,
    );
  },
  listOwners() {
    return api.get<PlatformAppConnectionOwnersResponse>(
      '/v1/platform-app-connections/owners',
    );
  },
  summary() {
    return api.get<PlatformAppConnectionsSummary>(
      '/v1/platform-app-connections/summary',
    );
  },
  revalidate(id: string) {
    return api.post<AppConnectionWithoutSensitiveData>(
      `/v1/platform-app-connections/${id}/revalidate`,
      {},
    );
  },
};
