import { HttpMethod } from '@activepieces/pieces-common';
import { GhostAuthValue, ghostClient, ghostCommon } from './client';

type QueryValue = string | number | boolean | undefined | null;
type Item = Record<string, unknown>;

export const ghostResource = {
  async list(
    auth: GhostAuthValue,
    resource: string,
    query: Record<string, QueryValue>,
    paginated = true
  ) {
    const response = await ghostClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/${resource}`,
      query,
    });
    const items = ghostCommon.records(response[resource]);
    return paginated
      ? { [resource]: items, ...ghostCommon.pagination(response['meta']) }
      : { [resource]: items, count: items.length };
  },
  async get(auth: GhostAuthValue, resource: string, path: string, query?: Record<string, QueryValue>) {
    const response = await ghostClient.request<Record<string, Item[]>>({
      auth,
      method: HttpMethod.GET,
      path: `/${resource}/${path}`,
      query,
    });
    return ghostCommon.first(response[resource], resource);
  },
  async create(
    auth: GhostAuthValue,
    resource: string,
    body: Item,
    query?: Record<string, QueryValue>
  ) {
    const response = await ghostClient.request<Record<string, Item[]>>({
      auth,
      method: HttpMethod.POST,
      path: `/${resource}`,
      query,
      body: { [resource]: [body] },
    });
    return ghostCommon.first(response[resource], resource);
  },
  async edit(
    auth: GhostAuthValue,
    resource: string,
    id: string,
    body: Item,
    query?: Record<string, QueryValue>
  ) {
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to change.');
    }
    const response = await ghostClient.request<Record<string, Item[]>>({
      auth,
      method: HttpMethod.PUT,
      path: `/${resource}/${id}`,
      query,
      body: { [resource]: [body] },
    });
    return ghostCommon.first(response[resource], resource);
  },
  async remove(auth: GhostAuthValue, resource: string, id: string, query?: Record<string, QueryValue>) {
    await ghostClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/${resource}/${id}`,
      query,
    });
  },
  pick(props: Record<string, unknown>, keys: string[]): Item {
    const body: Item = {};
    for (const key of keys) {
      const value = props[key];
      if (typeof value === 'string') {
        if (value.trim().length > 0) {
          body[key] = value.trim();
        }
      } else if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }
    return body;
  },
};
