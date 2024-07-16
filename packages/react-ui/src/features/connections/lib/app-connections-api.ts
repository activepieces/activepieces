import {
  AppConnection,
  ListAppConnectionsRequestQuery,
  SeekPage,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const appConnectionsApi = {
  list(
    request: ListAppConnectionsRequestQuery
  ): Promise<SeekPage<AppConnection>> {
    return api.get<SeekPage<AppConnection>>('/v1/app-connections', request);
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/app-connections/${id}`);
  },
};
