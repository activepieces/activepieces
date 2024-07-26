import { api } from '@/lib/api';
import {
  AppConnection,
  ListAppConnectionsRequestQuery,
  SeekPage,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

export const appConnectionsApi = {
  list(
    request: ListAppConnectionsRequestQuery,
  ): Promise<SeekPage<AppConnection>> {
    return api.get<SeekPage<AppConnection>>('/v1/app-connections', request);
  },
  upsert(request: UpsertAppConnectionRequestBody): Promise<AppConnection> {
    return api.post<AppConnection>('/v1/app-connections', request);
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/app-connections/${id}`);
  },
};
