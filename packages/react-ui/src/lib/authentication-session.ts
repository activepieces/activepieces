import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';

import {
  AuthenticationResponse,
  isNil,
  UserPrincipal,
} from '@activepieces/shared';

import { ApStorage } from './ap-browser-storage';
import { authenticationApi } from './authentication-api';
const tokenKey = 'token';
const projectIdKey = 'projectId';
export const authenticationSession = {
  setProjectId(projectId: string) {
    ApStorage.getInstance().setItem(projectIdKey, projectId);
  },
  saveResponse(response: AuthenticationResponse, isEmbedding: boolean) {
    if (isEmbedding) {
      ApStorage.setInstanceToSessionStorage();
    }
    ApStorage.getInstance().setItem(tokenKey, response.token);
    ApStorage.getInstance().setItem(projectIdKey, response.projectId);
    window.dispatchEvent(new Event('storage'));
  },
  isJwtExpired(token: string): boolean {
    if (!token) {
      return true;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded && decoded.exp && dayjs().isAfter(dayjs.unix(decoded.exp))) {
        return true;
      }
      return false;
    } catch (e) {
      return true;
    }
  },
  getToken(): string | null {
    return ApStorage.getInstance().getItem(tokenKey) ?? null;
  },

  getProjectId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    const projectId = ApStorage.getInstance().getItem(projectIdKey);
    if (!isNil(projectId)) {
      return projectId;
    }
    const decodedJwt = getDecodedJwt(token);
    if ('projectId' in decodedJwt && typeof decodedJwt.projectId === 'string') {
      return decodedJwt.projectId;
    }
    return null;
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
    ApStorage.getInstance().setItem(tokenKey, result.token);
    ApStorage.getInstance().setItem(projectIdKey, result.projectId);
    window.location.href = '/';
  },
  switchToProject(projectId: string) {
    if (authenticationSession.getProjectId() === projectId) {
      return;
    }
    ApStorage.getInstance().setItem(projectIdKey, projectId);
    window.dispatchEvent(new Event('storage'));
  },
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (isNil(token)) {
      return false;
    }
    return !this.isJwtExpired(token);
  },
  clearSession() {
    ApStorage.getInstance().removeItem(projectIdKey);
    ApStorage.getInstance().removeItem(tokenKey);
  },
  logOut() {
    this.clearSession();
    window.location.href = '/sign-in';
  },
};

function getDecodedJwt(token: string): UserPrincipal {
  return jwtDecode<UserPrincipal>(token);
}
