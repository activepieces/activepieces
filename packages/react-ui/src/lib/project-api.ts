import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  CreatePlatformProjectRequest,
  UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared';
import {
  ListProjectRequestForUserQueryParams,
  ProjectWithLimits,
  ProjectWithLimitsWithPlatform,
  SeekPage,
} from '@activepieces/shared';

export const projectApi = {
  current: async () => {
    return projectApi.get(authenticationSession.getProjectId()!);
  },
  list(request: ListProjectRequestForUserQueryParams) {
    return api.get<SeekPage<ProjectWithLimits>>('/v1/users/projects', request);
  },
  get: async (projectId: string) => {
    return api.get<ProjectWithLimits>(`/v1/users/projects/${projectId}`);
  },
  update: async (projectId: string, request: UpdateProjectPlatformRequest) => {
    return api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, request);
  },
  create: async (request: CreatePlatformProjectRequest) => {
    return api.post<ProjectWithLimits>('/v1/projects', request);
  },
  delete: async (projectId: string) => {
    return api.delete<void>(`/v1/projects/${projectId}`);
  },
  listForPlatforms: async () => {
    return api.get<ProjectWithLimitsWithPlatform[]>(
      '/v1/users/projects/platforms',
    );
  },
};
