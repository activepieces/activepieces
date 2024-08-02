import {
  AuthenticationResponse,
  ProjectMemberRole,
} from '@activepieces/shared';

import { projectApi } from '@/lib/project-api';

const currentUserKey = 'currentUser';
const tokenKey = 'token';
const projectIdKey = 'projectId';
const projectRole = 'projectRole';
export const platformCacheKey = 'platform';
export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(currentUserKey, JSON.stringify(response));
    localStorage.setItem(projectIdKey, response.projectId);
    localStorage.setItem(
      projectRole,
      response.projectRole ?? ProjectMemberRole.VIEWER,
    );
  },
  getToken(): string | null {
    return localStorage.getItem(tokenKey) ?? null;
  },
  getProjectId(): string {
    const currentProjectId = localStorage.getItem(projectIdKey)!;
    return currentProjectId;
  },
  getPlatformId(): string | null {
    return this.getCurrentUser()?.platformId ?? null;
  },
  getUserProjectRole() {
    return this.getCurrentUser()?.projectRole ?? null;
  },
  async switchToSession(projectId: string) {
    const result = await projectApi.getTokenForProject(projectId);
    localStorage.setItem(tokenKey, result.token);
    localStorage.setItem(projectIdKey, projectId);
  },
  isLoggedIn(): boolean {
    return !!this.getToken();
  },
  LogOut() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(currentUserKey);
    localStorage.removeItem(projectIdKey);
    localStorage.removeItem(projectRole);
    window.location.href = '/sign-in';
  },
  getCurrentUser(): AuthenticationResponse | null {
    const user = localStorage.getItem(currentUserKey);
    if (user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null;
  },
};
