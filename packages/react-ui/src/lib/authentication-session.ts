import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';

import { projectApi } from '@/lib/project-api';
import { AuthenticationResponse, isNil } from '@activepieces/shared';

const tokenKey = 'token';
export const currentUserKey = 'currentUser';
export const platformCacheKey = 'platform';
export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(currentUserKey, JSON.stringify(response));
    window.dispatchEvent(new Event('storage'));
  },
  getToken(): string | null {
    return localStorage.getItem(tokenKey) ?? null;
  },
  getProjectId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    const decodedJwt = jwtDecode<{ projectId: string }>(token);
    return decodedJwt.projectId;
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
  },
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (isNil(token)) {
      return false;
    }
    const decodedJwt = jwtDecode(token);
    const isExpired =
      isNil(decodedJwt.exp) || dayjs.unix(decodedJwt.exp).isBefore(dayjs());
    if (isExpired) {
      return false;
    }
    return !!this.getCurrentUser();
  },
  logOut() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(currentUserKey);
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
