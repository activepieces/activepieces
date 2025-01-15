import { jwtDecode } from 'jwt-decode';

import { AuthenticationResponse, isNil } from '@activepieces/shared';

import { authenticationApi } from './authentication-api';

const tokenKey = 'token';
const currentUserKey = 'currentUser';
export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem(tokenKey, response.token);
    localStorage.setItem(
      currentUserKey,
      JSON.stringify({
        ...response,
        token: undefined,
      }),
    );
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
  appendProjectRoutePrefix(path: string): string {
    const projectId = this.getProjectId();
    if (isNil(projectId)) {
      return path;
    }
    return `/projects/${projectId}${path.startsWith('/') ? path : `/${path}`}`;
  },
  getPlatformId(): string | null {
    return this.getCurrentUser()?.platformId ?? null;
  },
  getUserPlatformRole() {
    return this.getCurrentUser()?.platformRole ?? null;
  },
  async switchToPlatform(platformId: string) {
    if (authenticationSession.getPlatformId() === platformId) {
      return;
    }
    const result = await authenticationApi.switchPlatform({
      platformId,
    });
    localStorage.setItem(tokenKey, result.token);
    localStorage.setItem(
      currentUserKey,
      JSON.stringify({
        ...this.getCurrentUser(),
        platformId,
      }),
    );
    window.location.href = '/';
  },
  async switchToSession(projectId: string) {
    if (authenticationSession.getProjectId() === projectId) {
      return;
    }
    const result = await authenticationApi.switchProject({ projectId });
    localStorage.setItem(tokenKey, result.token);
    localStorage.setItem(
      currentUserKey,
      JSON.stringify({
        ...this.getCurrentUser(),
        projectId,
      }),
    );
    window.dispatchEvent(new Event('storage'));
  },
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  },
  clearSession() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(currentUserKey);
  },
  logOut() {
    this.clearSession();
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
