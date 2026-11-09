import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  AuthenticationResponse,
  Principal,
  PrincipalType,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { jwtDecode } from 'jwt-decode';
import { matchPath } from 'react-router-dom';

import { authenticationApi } from '@/api/authentication-api';
import { queryClient } from '@/app/query-client';

import { ApStorage } from './ap-browser-storage';
import { routeLocation } from './route-location';
import { safeStorage } from './safe-storage';
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
    return authenticationSession.projectIdFor({
      pathname: routeLocation.pathname(),
      storedProjectId: authenticationSession.getStoredProjectId(),
    });
  },
  projectIdFor({
    pathname,
    storedProjectId,
  }: {
    pathname: string;
    storedProjectId: string | null;
  }): string | null {
    return (
      authenticationSession.getProjectIdFromPath(pathname) ?? storedProjectId
    );
  },
  getProjectIdFromPath(pathname: string): string | null {
    return (
      matchPath({ path: '/projects/:projectId', end: false }, pathname)?.params
        .projectId ?? null
    );
  },
  getStoredProjectId(): string | null {
    const token = authenticationSession.getToken();
    if (isNil(token)) {
      return null;
    }
    const tabProject = readTabProject();
    if (!isNil(tabProject) && tabProject.userId === readUserId(token)) {
      return tabProject.projectId;
    }
    return readSharedProjectId(token);
  },
  // Pins this tab to the project it opened on, so another tab switching
  // projects does not move it. Runs once at start, never while reading.
  pinTabProject(): void {
    const token = authenticationSession.getToken();
    if (isNil(token) || !isNil(readTabProject())) {
      return;
    }
    const sharedProjectId = readSharedProjectId(token);
    if (!isNil(sharedProjectId)) {
      writeTabProject({
        userId: readUserId(token),
        projectId: sharedProjectId,
      });
    }
  },
  getCurrentUserId(): string | null {
    const token = this.getToken();
    if (isNil(token)) {
      return null;
    }
    return readUserId(token);
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
    if (decodedJwt && 'platform' in decodedJwt && decodedJwt.platform) {
      return decodedJwt.platform.id;
    }
    return null;
  },
  isOnboarding(): boolean {
    const token = this.getToken();
    if (isNil(token)) {
      return false;
    }
    return getDecodedJwt(token)?.type === PrincipalType.ONBOARDING;
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

function getDecodedJwt(token: string): Principal | null {
  return tryCatchSync(() => jwtDecode<Principal>(token)).data ?? null;
}

function readUserId(token: string): string | null {
  return getDecodedJwt(token)?.id ?? null;
}

function readSharedProjectId(token: string): string | null {
  const projectId = ApStorage.getInstance().getItem(projectIdKey);
  if (!isNil(projectId)) {
    return projectId;
  }
  const decodedJwt = getDecodedJwt(token);
  if (
    decodedJwt &&
    'projectId' in decodedJwt &&
    typeof decodedJwt.projectId === 'string'
  ) {
    return decodedJwt.projectId;
  }
  return null;
}

function readTabProject(): TabProject | null {
  const parsed = safeStorage.readJson({ area: 'session', key: tabProjectKey });
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
  safeStorage.writeJson({
    area: 'session',
    key: tabProjectKey,
    value: tabProject,
  });
}

function saveProjectIdOrClear(projectId: string | null | undefined): void {
  if (isNil(projectId)) {
    ApStorage.getInstance().removeItem(projectIdKey);
    safeStorage.remove({ area: 'session', key: tabProjectKey });
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
