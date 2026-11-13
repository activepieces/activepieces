import { HttpMethod } from '@activepieces/pieces-common';

import { raindropClient } from './client';

import type { RaindropAuthValue, RaindropCollection } from './types';

async function listCollections({
  auth,
}: {
  auth: RaindropAuthValue;
}): Promise<RaindropCollection[]> {
  const response = await raindropClient.request<{
    items: RaindropCollection[];
  }>({ auth, method: HttpMethod.GET, path: '/collections' });
  return response.items;
}

async function listChildCollections({
  auth,
}: {
  auth: RaindropAuthValue;
}): Promise<RaindropCollection[]> {
  const response = await raindropClient.request<{
    items: RaindropCollection[];
  }>({ auth, method: HttpMethod.GET, path: '/collections/childrens' });
  return response.items;
}

export const raindropApi = { listCollections, listChildCollections };
