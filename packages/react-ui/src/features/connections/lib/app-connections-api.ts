import { api } from '@/lib/api';
import {
  AppConnectionWithoutSensitiveData,
  ListAppConnectionsRequestQuery,
  SeekPage,
  UpdateConnectionValueRequestBody,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

export const appConnectionsApi = {
  list(
    request: ListAppConnectionsRequestQuery,
  ): Promise<SeekPage<AppConnectionWithoutSensitiveData>> {
    return api.get<SeekPage<AppConnectionWithoutSensitiveData>>(
      '/v1/app-connections',
      request,
    );
  },
  upsert(
    request: UpsertAppConnectionRequestBody,
  ): Promise<AppConnectionWithoutSensitiveData> {
    return api.post<AppConnectionWithoutSensitiveData>(
      '/v1/app-connections',
      request,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/app-connections/${id}`);
  },
  update(
    id: string,
    request: UpdateConnectionValueRequestBody,
  ): Promise<AppConnectionWithoutSensitiveData> {
    return api.post<AppConnectionWithoutSensitiveData>(
      `/v1/app-connections/${id}`,
      request,
    );
  },
};
