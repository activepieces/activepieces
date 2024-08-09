import { projectApi } from '@/lib/project-api';
import { AuthenticationResponse } from '@activepieces/shared';

const currentUserKey = 'currentUser';
const tokenKey = 'token';
const projectIdKey = 'projectId';
export const platformCacheKey = 'platform';
export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(currentUserKey, JSON.stringify(response));
    localStorage.setItem(projectIdKey, response.projectId);
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
    return (
      !!this.getToken() && !!this.getCurrentUser() && !!this.getProjectId()
    );
  },
  LogOut() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(currentUserKey);
    localStorage.removeItem(projectIdKey);
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
