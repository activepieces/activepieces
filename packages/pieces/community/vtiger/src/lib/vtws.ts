import { HttpMethod } from '@activepieces/pieces-common';
import * as crypto from 'crypto-js';
import { Instance } from './models';
import {
  normalizeInstanceUrl,
  REST_UNAVAILABLE,
  sendVtiger,
  VtigerApiError,
  VtigerCredentials,
  VtigerEnvelope,
} from './rest-client';

export function calculateAuthKey({
  challengeToken,
  accessKey,
}: {
  challengeToken: string;
  accessKey: string;
}): string {
  return crypto.MD5(challengeToken + accessKey).toString(crypto.enc.Hex);
}

export function webserviceUrl(creds: VtigerCredentials): string {
  return `${normalizeInstanceUrl(creds.instance_url)}/webservice.php`;
}

export async function vtwsLogin(creds: VtigerCredentials): Promise<VtwsSession> {
  const url = webserviceUrl(creds);
  const challenge = await sendVtiger<{ token?: string }>({
    url,
    method: HttpMethod.GET,
    query: { operation: 'getchallenge', username: creds.username },
  });
  const token = challenge.result?.token;
  if (typeof token !== 'string' || token === '') {
    throw new VtigerApiError({
      code: 'CHALLENGE_FAILED',
      message: 'Vtiger did not return a login challenge token. Check the instance URL and username.',
    });
  }
  const login = await sendVtiger<Instance>({
    url,
    method: HttpMethod.POST,
    form: {
      operation: 'login',
      username: creds.username,
      accessKey: calculateAuthKey({ challengeToken: token, accessKey: creds.password }),
    },
  });
  const sessionName = login.result?.sessionId || login.result?.sessionName;
  if (!login.result || typeof sessionName !== 'string' || sessionName === '') {
    throw new VtigerApiError({
      code: 'LOGIN_FAILED',
      message: 'Vtiger did not return a session. Check the username and access key.',
    });
  }
  return { sessionName, instance: login.result };
}

export async function vtwsCall<T>({
  creds,
  session,
  operation,
  params,
}: {
  creds: VtigerCredentials;
  session: VtwsSession;
  operation: VtwsOperation;
  params: Record<string, string>;
}): Promise<VtwsResult<T>> {
  const data = { ...params, operation, sessionName: session.sessionName };
  const envelope: VtigerEnvelope<T> = await sendVtiger<T>(
    READ_OPERATIONS.has(operation)
      ? { url: webserviceUrl(creds), method: HttpMethod.GET, query: data }
      : { url: webserviceUrl(creds), method: HttpMethod.POST, form: data }
  );
  if (envelope.result === undefined) {
    throw new VtigerApiError({
      code: 'UNEXPECTED_RESPONSE',
      message: `Vtiger returned no result for ${operation}`,
    });
  }
  return { success: true, result: envelope.result };
}

export async function vtwsQuery<R>({
  creds,
  session,
  query,
}: {
  creds: VtigerCredentials;
  session: VtwsSession;
  query: string;
}): Promise<R[]> {
  const { result } = await vtwsCall<R[]>({ creds, session, operation: 'query', params: { query } });
  return Array.isArray(result) ? result : [];
}

export async function restOrVtws<T>({
  rest,
  vtws,
}: {
  rest: () => Promise<T>;
  vtws: () => Promise<T>;
}): Promise<T> {
  try {
    return await rest();
  } catch (error) {
    if (error instanceof VtigerApiError && error.code === REST_UNAVAILABLE) {
      return vtws();
    }
    throw error;
  }
}

const READ_OPERATIONS = new Set<VtwsOperation>(['query', 'retrieve', 'describe', 'listtypes', 'sync']);

export type VtwsOperation =
  | 'create'
  | 'retrieve'
  | 'delete'
  | 'update'
  | 'revise'
  | 'query'
  | 'describe'
  | 'listtypes'
  | 'sync';

export type VtwsSession = {
  sessionName: string;
  instance: Instance;
};

export type VtwsResult<T> = {
  success: true;
  result: T;
};
