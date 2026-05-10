import {
  AppConnectionOwners,
  AppConnectionWithoutSensitiveData,
  GetOAuth2AuthorizationUrlRequestBody,
  GetOAuth2AuthorizationUrlResponse,
  ListAppConnectionOwnersRequestQuery,
  ListAppConnectionsRequestQuery,
  ReplaceAppConnectionsRequestBody,
  SeekPage,
  UpdateConnectionValueRequestBody,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';

import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

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
  replace(request: ReplaceAppConnectionsRequestBody): Promise<void> {
    return api.post<void>(`/v1/app-connections/replace`, request);
  },
  getOwners(
    request: ListAppConnectionOwnersRequestQuery,
  ): Promise<SeekPage<AppConnectionOwners>> {
    return api.get<SeekPage<AppConnectionOwners>>(
      '/v1/app-connections/owners',
      request,
    );
  },
  getOAuth2AuthorizationUrl(
    request: Omit<GetOAuth2AuthorizationUrlRequestBody, 'projectId'> & {
      projectId?: string;
    },
  ): Promise<GetOAuth2AuthorizationUrlResponse> {
    const { projectId: projectIdOverride, ...rest } = request;
    const projectId = projectIdOverride ?? authenticationSession.getProjectId();
    return api.post<GetOAuth2AuthorizationUrlResponse>(
      '/v1/app-connections/oauth2/authorization-url',
      { ...rest, projectId },
    );
  },
};
