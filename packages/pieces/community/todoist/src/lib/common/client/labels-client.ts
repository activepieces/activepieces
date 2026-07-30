import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { isNotUndefined, pickBy } from '@activepieces/pieces-framework';

const API = 'https://api.todoist.com/api/v1';

export type TodoistLabel = {
  id: string;
  name: string;
  color: string;
  order: number;
  is_favorite: boolean;
};

type PaginatedResponse<T> = {
  results: T[];
  next_cursor: string | null;
};

async function fetchAllPages<T>(
  token: string,
  url: string,
  baseParams: Record<string, string | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;

  do {
    const queryParams = pickBy(
      { ...baseParams, cursor: cursor ?? undefined },
      isNotUndefined,
    );

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams,
    };

    const response = await httpClient.sendRequest<PaginatedResponse<T>>(request);
    items.push(...response.body.results);
    cursor = response.body.next_cursor;
  } while (cursor);

  return items;
}

export type CreateLabelParams = {
  token: string;
  name: string;
  color?: string | undefined;
  order?: number | undefined;
  is_favorite?: boolean | undefined;
};

export type UpdateLabelParams = {
  token: string;
  label_id: string;
  name?: string | undefined;
  color?: string | undefined;
  order?: number | undefined;
  is_favorite?: boolean | undefined;
};

export const todoistLabelsClient = {
  async create({
    token,
    name,
    color,
    order,
    is_favorite,
  }: CreateLabelParams): Promise<TodoistLabel> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/labels`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: pickBy({ name, color, order, is_favorite }, isNotUndefined),
    };

    const response = await httpClient.sendRequest<TodoistLabel>(request);
    return response.body;
  },

  async update({
    token,
    label_id,
    name,
    color,
    order,
    is_favorite,
  }: UpdateLabelParams): Promise<TodoistLabel> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/labels/${label_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: pickBy({ name, color, order, is_favorite }, isNotUndefined),
    };

    const response = await httpClient.sendRequest<TodoistLabel>(request);
    return response.body;
  },

  async delete({ token, label_id }: { token: string; label_id: string }): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${API}/labels/${label_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    };

    await httpClient.sendRequest(request);
  },

  async list({ token }: { token: string }): Promise<TodoistLabel[]> {
    return fetchAllPages<TodoistLabel>(token, `${API}/labels`);
  },

  async get({ token, label_id }: { token: string; label_id: string }): Promise<TodoistLabel> {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${API}/labels/${label_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    };

    const response = await httpClient.sendRequest<TodoistLabel>(request);
    return response.body;
  },

  async listShared({
    token,
    omit_personal,
  }: {
    token: string;
    omit_personal?: boolean | undefined;
  }): Promise<string[]> {
    return fetchAllPages<string>(token, `${API}/labels/shared`, {
      omit_personal: omit_personal === undefined ? undefined : String(omit_personal),
    });
  },

  async renameShared({
    token,
    name,
    new_name,
  }: {
    token: string;
    name: string;
    new_name: string;
  }): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/labels/shared/rename`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: { name, new_name },
    };

    await httpClient.sendRequest(request);
  },

  async removeShared({ token, name }: { token: string; name: string }): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/labels/shared/remove`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: { name },
    };

    await httpClient.sendRequest(request);
  },
};
