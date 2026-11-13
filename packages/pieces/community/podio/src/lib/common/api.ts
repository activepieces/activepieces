import { HttpMethod } from '@activepieces/pieces-common';
import { podioClient } from './client';
import { podioUtils } from './utils';
import type {
  PodioApp,
  PodioAppEmailConfiguration,
  PodioAppField,
  PodioAuthValue,
  PodioComment,
  PodioForm,
  PodioHook,
  PodioItemFilter,
  PodioItemFilterResponse,
  PodioShare,
  PodioStatus,
  PodioUserStatus,
} from './types';

async function getUserStatus({ auth, timeout }: { auth: PodioAuthValue; timeout?: number }): Promise<PodioUserStatus> {
  return await podioClient.request<PodioUserStatus>({ auth, method: HttpMethod.GET, path: '/user/status', timeout });
}

async function getApp({ auth, appId }: { auth: PodioAuthValue; appId: unknown }): Promise<PodioApp> {
  return await podioClient.request<PodioApp>({
    auth,
    method: HttpMethod.GET,
    path: `/app/${appId}`,
    query: { view: 'full' },
  });
}

async function filterItems({ auth, appId, body, spaceId }: { auth: PodioAuthValue; appId: unknown; body: PodioItemFilter; spaceId?: string }): Promise<PodioItemFilterResponse> {
  return await podioClient.request<PodioItemFilterResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/item/app/${appId}/filter/`,
    query: podioUtils.query({ values: { space_id: spaceId } }),
    body,
  });
}

async function createHook({ auth, refType, refId, url, type }: { auth: PodioAuthValue; refType: 'app' | 'space'; refId: number; url: string; type: string }): Promise<PodioHook> {
  return await podioClient.request<PodioHook>({
    auth,
    method: HttpMethod.POST,
    path: `/hook/${refType}/${refId}/`,
    body: { url, type },
  });
}

async function deleteHook({ auth, hookId }: { auth: PodioAuthValue; hookId: number }): Promise<void> {
  await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/hook/${hookId}` });
}

async function getAppField({ auth, appId, fieldId }: { auth: PodioAuthValue; appId: string; fieldId: string }): Promise<PodioAppField> {
  return await podioClient.request<PodioAppField>({ auth, method: HttpMethod.GET, path: `/app/${appId}/field/${fieldId}` });
}

async function getForm({ auth, formId }: { auth: PodioAuthValue; formId: string }): Promise<PodioForm> {
  return await podioClient.request<PodioForm>({ auth, method: HttpMethod.GET, path: `/form/${formId}` });
}

async function getComment({ auth, commentId }: { auth: PodioAuthValue; commentId: string }): Promise<PodioComment> {
  return await podioClient.request<PodioComment>({ auth, method: HttpMethod.GET, path: `/comment/${commentId}` });
}

async function getStatus({ auth, statusId }: { auth: PodioAuthValue; statusId: string }): Promise<PodioStatus> {
  return await podioClient.request<PodioStatus>({ auth, method: HttpMethod.GET, path: `/status/${statusId}` });
}

async function getAppEmailConfiguration({ auth, appId }: { auth: PodioAuthValue; appId: string }): Promise<PodioAppEmailConfiguration> {
  return await podioClient.request<PodioAppEmailConfiguration>({ auth, method: HttpMethod.GET, path: `/email/app/${appId}` });
}

async function getShare({ auth, shareId }: { auth: PodioAuthValue; shareId: string }): Promise<PodioShare> {
  return await podioClient.request<PodioShare>({ auth, method: HttpMethod.GET, path: `/app_store/${shareId}/v2` });
}

async function requestHookVerification({ auth, hookId }: { auth: PodioAuthValue; hookId: number }): Promise<void> {
  await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/hook/${hookId}/verify/request` });
}

async function validateHookIfVerification({ auth, body, hookId }: { auth: PodioAuthValue; body: unknown; hookId: number | null }): Promise<boolean> {
  if (!body || typeof body !== 'object' || !('type' in body) || body.type !== 'hook.verify') {
    return false;
  }
  if (hookId === null || !('hook_id' in body) || String(body.hook_id) !== String(hookId) || !('code' in body)) {
    return true;
  }
  await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/hook/${hookId}/verify/validate`, body: { code: body.code } });
  return true;
}

export const podioApi = {
  getUserStatus,
  getApp,
  filterItems,
  createHook,
  deleteHook,
  requestHookVerification,
  validateHookIfVerification,
  getAppField,
  getForm,
  getComment,
  getStatus,
  getAppEmailConfiguration,
  getShare,
};
