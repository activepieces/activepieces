import { api } from '@/lib/api';
import {
  AppConnectionWithoutSensitiveData,
  ListGlobalConnectionsRequestQuery,
  SeekPage,
  UpdateGlobalConnectionValueRequestBody,
  UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared';

export const globalConnectionsApi = {
  list(
    request: ListGlobalConnectionsRequestQuery,
  ): Promise<SeekPage<AppConnectionWithoutSensitiveData>> {
    return api.get<SeekPage<AppConnectionWithoutSensitiveData>>(
      '/v1/global-connections',
      request,
    );
  },
  upsert(
    request: UpsertGlobalConnectionRequestBody,
  ): Promise<AppConnectionWithoutSensitiveData> {
    return api.post<AppConnectionWithoutSensitiveData>(
      '/v1/global-connections',
      request,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/global-connections/${id}`);
  },
  update(
    id: string,
    request: UpdateGlobalConnectionValueRequestBody,
  ): Promise<AppConnectionWithoutSensitiveData> {
    return api.post<AppConnectionWithoutSensitiveData>(
      `/v1/global-connections/${id}`,
      request,
    );
  },
};
