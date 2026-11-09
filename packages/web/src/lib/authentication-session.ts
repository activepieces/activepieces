import { isNil, tryCatchSync } from '@activepieces/core-utils';
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
import { routeLocation } from './route-location';
import { telemetryUtils } from './telemetry-utils';

const tokenKey = 'token';
const projectIdKey = 'projectId';
const tabProjectKey = 'ap:tab-project';
const SESSION_CHANGED_EVENT = 'ap:session-changed';
export const authenticationSession = {
  setProjectId(projectId: string) {
    saveProjectIdOrClear(projectId);
    notifySessionChanged();
  },
  subscribe(listener: () => void): () => void {
    window.addEventListener(SESSION_CHANGED_EVENT, listener);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, listener);
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
    if (isNil(authenticationSession.getToken())) {
      return null;
    }
    return (
      authenticationSession.getProjectIdFromPath(routeLocation.pathname()) ??
      authenticationSession.getStoredProjectId()
    );
  },
  getProjectIdFromPath(pathname: string): string | null {
    const match = /^\/projects\/([^/]+)/.exec(pathname);
    return match ? match[1] : null;
  },
  getStoredProjectId(): string | null {
    const token = authenticationSession.getToken();
    if (isNil(token)) {
      return null;
    }
    const userId = readUserId(token);
    const tabProject = readTabProject();
    if (!isNil(tabProject) && tabProject.userId === userId) {
      return tabProject.projectId;
    }
    const sharedProjectId = readSharedProjectId(token);
    if (!isNil(sharedProjectId)) {
      writeTabProject({ userId, projectId: sharedProjectId });
    }
    return sharedProjectId;
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
    if (authenticationSession.getStoredProjectId() === projectId) {
      return;
    }
    saveProjectIdOrClear(projectId);
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
    saveProjectIdOrClear(null);
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
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

function getDecodedJwt(token: string): Principal {
  return jwtDecode<Principal>(token);
}

function readUserId(token: string): string | null {
  return tryCatchSync(() => getDecodedJwt(token).id).data ?? null;
}

function readSharedProjectId(token: string): string | null {
  const projectId = ApStorage.getInstance().getItem(projectIdKey);
  if (!isNil(projectId)) {
    return projectId;
  }
  const decodedJwt = getDecodedJwt(token);
  if ('projectId' in decodedJwt && typeof decodedJwt.projectId === 'string') {
    return decodedJwt.projectId;
  }
  return null;
}

function readTabProject(): TabProject | null {
  const raw = tryCatchSync(() =>
    window.sessionStorage.getItem(tabProjectKey),
  ).data;
  if (isNil(raw)) {
    return null;
  }
  const parsed = tryCatchSync<unknown>(() => JSON.parse(raw)).data;
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('projectId' in parsed) ||
    typeof parsed.projectId !== 'string' ||
    !('userId' in parsed) ||
    (typeof parsed.userId !== 'string' && parsed.userId !== null)
  ) {
    return null;
  }
  return { projectId: parsed.projectId, userId: parsed.userId };
}

function writeTabProject(tabProject: TabProject): void {
  tryCatchSync(() =>
    window.sessionStorage.setItem(tabProjectKey, JSON.stringify(tabProject)),
  );
}

function saveProjectIdOrClear(projectId: string | null | undefined): void {
  if (isNil(projectId)) {
    ApStorage.getInstance().removeItem(projectIdKey);
    tryCatchSync(() => window.sessionStorage.removeItem(tabProjectKey));
    return;
  }
  ApStorage.getInstance().setItem(projectIdKey, projectId);
  const token = authenticationSession.getToken();
  writeTabProject({
    userId: isNil(token) ? null : readUserId(token),
    projectId,
  });
}

type TabProject = { userId: string | null; projectId: string };
