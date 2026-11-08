import { isNil } from '@activepieces/core-utils';
import {
  AuthenticationResponse,
  Principal,
  PrincipalType,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';

import { authenticationApi } from '@/api/authentication-api';
import { queryClient } from '@/app/query-client';

import { ApStorage } from './ap-browser-storage';
import { telemetryUtils } from './telemetry-utils';

const tokenKey = 'token';
const projectIdKey = 'projectId';
const SESSION_CHANGED_EVENT = 'ap:session-changed';
const tabSnapshot: { projectId: string | null | undefined } = {
  projectId: undefined,
};
export const authenticationSession = {
  setProjectId(projectId: string) {
    ApStorage.getInstance().setItem(projectIdKey, projectId);
    notifySessionChanged();
  },
  subscribe(listener: () => void): () => void {
    let scheduled = false;
    const onChange = () => {
      if (scheduled) {
        return;
      }
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        listener();
      });
    };
    window.addEventListener(SESSION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onChange);
  },
  saveResponse(response: AuthenticationResponse, isEmbedding: boolean) {
    if (isEmbedding) {
      ApStorage.setInstanceToSessionStorage();
    }
    ApStorage.getInstance().setItem(tokenKey, response.token);
    saveProjectIdOrClear(response.projectId);
    queryClient.invalidateQueries({ queryKey: ['flags'] });
    notifySessionChanged();
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
  getTabProjectId(): string | null {
    if (tabSnapshot.projectId === undefined) {
      tabSnapshot.projectId = authenticationSession.getProjectId();
    }
    return tabSnapshot.projectId;
  },
  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    const decodedJwt = getDecodedJwt(token);
    return decodedJwt.id;
  },
  appendProjectRoutePrefix(path: string, projectIdOverride?: string): string {
    const projectId = projectIdOverride ?? this.getProjectId();

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
    if ('platform' in decodedJwt && decodedJwt.platform) {
      return decodedJwt.platform.id;
    }
    return null;
  },
  isOnboarding(): boolean {
    const token = this.getToken();
    if (isNil(token)) {
      return false;
    }
    const decodedJwt = jwtDecode<{ type: string }>(token);
    return decodedJwt.type === PrincipalType.ONBOARDING;
  },
  async switchToPlatform(platformId: string) {
    if (authenticationSession.getPlatformId() === platformId) {
      return;
    }
    const result = await authenticationApi.switchPlatform({
      platformId,
    });
    ApStorage.getInstance().setItem(tokenKey, result.token);
    saveProjectIdOrClear(result.projectId);
    window.location.href = '/';
  },
  switchToProject(projectId: string) {
    if (authenticationSession.getProjectId() === projectId) {
      return;
    }
    ApStorage.getInstance().setItem(projectIdKey, projectId);
    notifySessionChanged();
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
    notifySessionChanged();
  },
  logOut() {
    const hadSession = !isNil(this.getToken());
    this.clearSession();
    if (hadSession) {
      telemetryUtils.resetIdentity();
    }
    window.location.href = '/sign-in';
  },
};

function notifySessionChanged(): void {
  tabSnapshot.projectId = undefined;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

function getDecodedJwt(token: string): Principal {
  return jwtDecode<Principal>(token);
}

function saveProjectIdOrClear(projectId: string | null | undefined): void {
  if (isNil(projectId)) {
    ApStorage.getInstance().removeItem(projectIdKey);
    return;
  }
  ApStorage.getInstance().setItem(projectIdKey, projectId);
}
