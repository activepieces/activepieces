import { api } from '@/lib/api';
import {
  AppConnection,
  ListAppConnectionsRequestQuery,
  SeekPage,
} from '@activepieces/shared';

export const appConnectionsApi = {
  list(
    request: ListAppConnectionsRequestQuery
  ): Promise<SeekPage<AppConnection>> {
    return api.get<SeekPage<AppConnection>>('/v1/app-connections', request);
  },
};
