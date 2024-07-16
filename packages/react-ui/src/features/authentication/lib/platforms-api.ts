import { Platform, ProjectMemberRole } from "@activepieces/shared";
import { api } from "../../../lib/api";
import { authenticationSession } from "./authentication-session";

export const platformCacheKey = 'platform';

export const RolesDisplayNames: { [k: string]: string } = {
    [ProjectMemberRole.ADMIN]: `Admin`,
    [ProjectMemberRole.EDITOR]: `Editor`,
    [ProjectMemberRole.OPERATOR]: `Operator`,
    [ProjectMemberRole.VIEWER]: `Viewer`,
  };

  
export const platformApi = {
    getCurrentPlatform() {
        const platformId = authenticationSession.getPlatformId();
        if (!platformId) {
           throw Error('No platform id found');
        }
        return api.get<Platform>(`/v1/platforms/${platformId}`)
    }
}