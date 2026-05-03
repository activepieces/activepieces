import {
  ListPlatformAppConnectionsRequestQuery,
  PlatformAppConnectionOwner,
  PlatformAppConnectionsListItem,
  SeekPage,
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
    return api.get<SeekPage<PlatformAppConnectionOwner>>(
      '/v1/platform-app-connections/owners',
    );
  },
};
