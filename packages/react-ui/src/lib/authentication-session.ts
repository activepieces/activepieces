import { jwtDecode } from 'jwt-decode';

import { AuthenticationResponse, isNil, Principal } from '@activepieces/shared';

import { authenticationApi } from './authentication-api';

const tokenKey = 'token';
export const authenticationSession = {
  saveResponse(response: AuthenticationResponse) {
    localStorage.setItem(tokenKey, response.token);
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
    const decodedJwt = getDecodedJwt(token);
    return decodedJwt.projectId;
  },
  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    const decodedJwt = getDecodedJwt(token);
    return decodedJwt.id;
  },
  appendProjectRoutePrefix(path: string): string {
    const projectId = this.getProjectId();
    if (isNil(projectId)) {
      return path;
    }
    return `/projects/${projectId}${path.startsWith('/') ? path : `/${path}`}`;
  },
  getPlatformId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    const decodedJwt = getDecodedJwt(token);
    return decodedJwt.platform.id;
  },
  async switchToPlatform(platformId: string) {
    if (authenticationSession.getPlatformId() === platformId) {
      return;
    }
    const result = await authenticationApi.switchPlatform({
      platformId,
    });
    localStorage.setItem(tokenKey, result.token);
    window.location.href = '/';
  },
  async switchToSession(projectId: string) {
    if (authenticationSession.getProjectId() === projectId) {
      return;
    }
    const result = await authenticationApi.switchProject({ projectId });
    localStorage.setItem(tokenKey, result.token);
    window.dispatchEvent(new Event('storage'));
  },
  isLoggedIn(): boolean {
    return !!this.getToken();
  },
  clearSession() {
    localStorage.removeItem(tokenKey);
  },
  logOut() {
    this.clearSession();
    window.location.href = '/sign-in';
  },
};

function getDecodedJwt(token: string): Principal {
  return jwtDecode<Principal>(token);
}
