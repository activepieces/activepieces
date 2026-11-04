import { HttpMethod } from '@activepieces/pieces-common';
import { podioClient } from './client';
import type { PodioApp, PodioAuthValue, PodioHook, PodioItemFilter, PodioItemFilterResponse, PodioUserStatus } from './types';

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

async function filterItems({ auth, appId, body }: { auth: PodioAuthValue; appId: unknown; body: PodioItemFilter }): Promise<PodioItemFilterResponse> {
  return await podioClient.request<PodioItemFilterResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/item/app/${appId}/filter/`,
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

export const podioApi = { getUserStatus, getApp, filterItems, createHook, deleteHook };
