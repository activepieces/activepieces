import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
  HUB_URL_BY_REGION,
  DEFAULT_CAPABILITIES,
  ELEMENT_KEY,
  REQUEST_TIMEOUT_MS,
} from './constants';
import { SnapshotElement, SNAPSHOT_SCRIPT } from './snapshot';

export const testmuaiCommon = {
  async createSession(params: {
    auth: TestMuAuth;
    name?: string;
    capabilities?: Record<string, unknown>;
  }): Promise<string> {
    const body = {
      capabilities: {
        alwaysMatch: {
          ...DEFAULT_CAPABILITIES,
          ...(params.capabilities ?? {}),
          'LT:Options': {
            username: params.auth.username,
            accessKey: params.auth.accessKey,
            build: 'activepieces-browser-cloud',
            name: params.name ?? 'Activepieces Browser Cloud Session',
            video: true,
            console: true,
          },
        },
      },
    };
    const res = await request<WebDriverValue<{ sessionId?: string }>>({
      auth: params.auth,
      method: HttpMethod.POST,
      path: '/session',
      body,
    });
    const sessionId = res.value?.sessionId;
    if (!sessionId) {
      throw new Error(
        'TestMu AI did not return a session ID. Check your username, access key, and region.'
      );
    }
    return sessionId;
  },

  sessionRequest<TRes = unknown>(params: {
    auth: TestMuAuth;
    sessionId: string;
    method: HttpMethod;
    path?: string;
    body?: Record<string, unknown>;
  }): Promise<TRes> {
    return request<TRes>({
      auth: params.auth,
      method: params.method,
      path: `/session/${params.sessionId}${params.path ?? ''}`,
      body: params.body,
    });
  },

  deleteSession(params: { auth: TestMuAuth; sessionId: string }): Promise<unknown> {
    return this.sessionRequest({
      auth: params.auth,
      sessionId: params.sessionId,
      method: HttpMethod.DELETE,
    });
  },

  async findElement(params: {
    auth: TestMuAuth;
    sessionId: string;
    selector: string;
  }): Promise<string> {
    const res = await this.sessionRequest<WebDriverValue<Record<string, string>>>({
      auth: params.auth,
      sessionId: params.sessionId,
      method: HttpMethod.POST,
      path: '/element',
      body: { using: 'css selector', value: params.selector },
    });
    const elementId = res.value?.[ELEMENT_KEY];
    if (!elementId) {
      throw new Error(
        `No element matched "${params.selector}". Run Snapshot Page to refresh element refs, then retry.`
      );
    }
    return elementId;
  },

  async runScript<TRes = unknown>(params: {
    auth: TestMuAuth;
    sessionId: string;
    script: string;
    args?: unknown[];
  }): Promise<TRes | undefined> {
    const res = await this.sessionRequest<WebDriverValue<TRes>>({
      auth: params.auth,
      sessionId: params.sessionId,
      method: HttpMethod.POST,
      path: '/execute/sync',
      body: { script: params.script, args: params.args ?? [] },
    });
    return res.value;
  },

  async snapshot(params: {
    auth: TestMuAuth;
    sessionId: string;
  }): Promise<SnapshotElement[]> {
    const elements = await this.runScript<SnapshotElement[]>({
      auth: params.auth,
      sessionId: params.sessionId,
      script: SNAPSHOT_SCRIPT,
    });
    return elements ?? [];
  },

  async elementText(params: {
    auth: TestMuAuth;
    sessionId: string;
    elementId: string;
  }): Promise<string> {
    const res = await this.sessionRequest<WebDriverValue<string>>({
      auth: params.auth,
      sessionId: params.sessionId,
      method: HttpMethod.GET,
      path: `/element/${params.elementId}/text`,
    });
    return res.value ?? '';
  },

  async screenshot(params: {
    auth: TestMuAuth;
    sessionId: string;
  }): Promise<string> {
    const res = await this.sessionRequest<WebDriverValue<string>>({
      auth: params.auth,
      sessionId: params.sessionId,
      method: HttpMethod.GET,
      path: '/screenshot',
    });
    return res.value ?? '';
  },
};

function baseUrl(auth: TestMuAuth): string {
  return HUB_URL_BY_REGION[auth.region] ?? HUB_URL_BY_REGION['us'];
}

function authHeaders(auth: TestMuAuth): Record<string, string> {
  const token = Buffer.from(`${auth.username}:${auth.accessKey}`).toString(
    'base64'
  );
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  };
}

async function request<TRes>(params: {
  auth: TestMuAuth;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<TRes> {
  const response = await httpClient.sendRequest<TRes>({
    method: params.method,
    url: `${baseUrl(params.auth)}${params.path}`,
    headers: authHeaders(params.auth),
    body: params.body,
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.body;
}

export interface TestMuAuth {
  username: string;
  accessKey: string;
  region: string;
}

type WebDriverValue<T> = { value?: T };
