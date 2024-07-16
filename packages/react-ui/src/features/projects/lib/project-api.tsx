import { authenticationSession } from '@/features/authentication/lib/authentication-session';
import { api } from '@/lib/api';
import { UpdateProjectPlatformRequest } from '@activepieces/ee-shared';
import {
    ListProjectRequestForUserQueryParams,
    ProjectWithLimits,
    SeekPage,
    SwitchProjectResponse,
} from '@activepieces/shared';

export const projectCacheKey = 'project';
export const projectApi = {
    current: async () => {
        return projectApi.get(authenticationSession.getProjectId());
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
    getTokenForProject: async (projectId: string) => {
        return api.post<SwitchProjectResponse>(
            `/v1/users/projects/${projectId}/token`,
            {
                projectId,
            }
        );
    },
};
