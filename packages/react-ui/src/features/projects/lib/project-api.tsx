import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { api } from "@/lib/api";
import { ProjectWithLimits } from "@activepieces/shared";
import { UpdateProjectPlatformRequest } from "../../../../../ee/shared/src";

export const projectApi = {
    current: async () => {
        return projectApi.get(authenticationSession.getProjectId());
    },
    get: async (projectId: string) => {
        return api.get<ProjectWithLimits>(`/v1/users/projects/${projectId}`);
    },
    update: async (projectId: string, request: UpdateProjectPlatformRequest) => {
        return api.post<ProjectWithLimits>(`/v1/projects/${projectId}`, request);
    }
}