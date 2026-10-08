import { AppConnectionType, isNil } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

async function request<T>({
  auth,
  method,
  path,
  queryParams,
  body,
}: TogglRequest): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl(auth)}${path}`,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authorizationHeader(auth),
      },
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    const status = httpStatusOf(error);
    if (isTwo(auth) && status === 402) {
      throw new Error(
        'Toggl 2.0 hourly API request limit reached for this organization (30 requests per hour on the Free plan). Wait for the limit to reset or upgrade the Toggl plan.'
      );
    }
    if (
      isTwo(auth) &&
      (status === 403 || status === 404) &&
      path.startsWith('/organizations/') &&
      (responseDetail(error) ?? '').toLowerCase().includes('organization')
    ) {
      throw new Error(
        `Toggl 2.0 denied access to organization ${auth.props.organization_id}. Check the Organization ID in the connection (the number after /organizations/ in the Toggl 2.0 address bar).`
      );
    }
    throw error;
  }
}

async function classicReportsRequest<T>({
  auth,
  workspaceId,
  body,
}: {
  auth: TogglAuthValue;
  workspaceId: number;
  body: Record<string, unknown>;
}): Promise<{ body: T; headers: Record<string, unknown> }> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${CLASSIC_REPORTS_BASE_URL}/workspace/${workspaceId}/search/time_entries`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authorizationHeader(auth),
    },
    body,
  });
  return { body: response.body, headers: response.headers ?? {} };
}

async function withNotFound<T>({
  label,
  run,
}: {
  label: string;
  run: () => Promise<T>;
}): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (httpStatusOf(error) === 404) {
      throw new Error(
        `${label} was not found. Check the ID and the selected workspace.`
      );
    }
    throw error;
  }
}

async function listTwoPages<T>({
  auth,
  path,
  queryParams,
}: {
  auth: TogglAuthValue;
  path: string;
  queryParams?: QueryParams;
}): Promise<T[]> {
  const collected = await collectTwoPages<T>({
    auth,
    path,
    queryParams: queryParams ?? {},
    page: 1,
  });
  return collected;
}

async function listTwoPageOrAll<T>({
  auth,
  path,
  queryParams,
  page,
  perPage,
}: {
  auth: TogglAuthValue;
  path: string;
  queryParams: QueryParams;
  page: number | undefined;
  perPage: number | undefined;
}): Promise<T[]> {
  if (isNil(page)) {
    return listTwoPages<T>({ auth, path, queryParams });
  }
  const size = Math.min(Math.max(Math.floor(perPage ?? TWO_PAGE_SIZE), 1), TWO_PAGE_SIZE);
  const body = await request<T[] | { data: T[] | null }>({
    auth,
    method: HttpMethod.GET,
    path,
    queryParams: {
      ...queryParams,
      page: String(Math.max(Math.floor(page), 1)),
      per_page: String(size),
    },
  });
  return Array.isArray(body) ? body : body?.data ?? [];
}

async function collectTwoPages<T>({
  auth,
  path,
  queryParams,
  page,
}: {
  auth: TogglAuthValue;
  path: string;
  queryParams: QueryParams;
  page: number;
}): Promise<T[]> {
  if (page > TWO_MAX_PAGES) {
    throw new Error(
      `Toggl 2.0 returned more than ${TWO_PAGE_SIZE * TWO_MAX_PAGES} results. Narrow the filters and try again.`
    );
  }
  const body = await request<T[] | { data: T[] | null }>({
    auth,
    method: HttpMethod.GET,
    path,
    queryParams: {
      ...queryParams,
      page: String(page),
      per_page: String(TWO_PAGE_SIZE),
    },
  });
  const items = Array.isArray(body) ? body : body?.data ?? [];
  if (items.length < TWO_PAGE_SIZE) {
    return items;
  }
  const rest = await collectTwoPages<T>({
    auth,
    path,
    queryParams,
    page: page + 1,
  });
  return [...items, ...rest];
}

function isTwo(auth: TogglAuthValue): auth is TogglTwoAuthValue {
  return auth.type === AppConnectionType.CUSTOM_AUTH;
}

function twoConnection({ props }: { props: TogglTwoProps }): TogglAuthValue {
  return { type: AppConnectionType.CUSTOM_AUTH, props };
}

function twoOrganizationId(auth: TogglTwoAuthValue): number {
  return requireId({
    value: auth.props.organization_id,
    label: 'Organization ID',
  });
}

function twoWorkspacePath({
  auth,
  workspaceId,
  path,
}: {
  auth: TogglTwoAuthValue;
  workspaceId: number;
  path: string;
}): string {
  return `/organizations/${twoOrganizationId(auth)}/workspaces/${workspaceId}${path}`;
}

async function twoSettings(auth: TogglAuthValue): Promise<TwoSettings> {
  return request<TwoSettings>({
    auth,
    method: HttpMethod.GET,
    path: '/users/me/settings',
  });
}

async function twoCurrentUserAccountId(
  auth: TogglAuthValue
): Promise<number | null> {
  const account = await request<{ user_account_id?: number } | null>({
    auth,
    method: HttpMethod.GET,
    path: '/accounts/me',
  });
  return account?.user_account_id ?? null;
}

async function twoOrganizationUsers({
  auth,
  perPage,
  queryParams,
}: {
  auth: TogglAuthValue;
  perPage: number;
  queryParams?: QueryParams;
}): Promise<TwoOrganizationUser[]> {
  if (!isTwo(auth)) {
    return [];
  }
  return request<TwoOrganizationUser[]>({
    auth,
    method: HttpMethod.GET,
    path: `/organizations/${twoOrganizationId(auth)}/users`,
    queryParams: { ...queryParams, page: '1', per_page: String(perPage) },
  });
}

async function twoWorkspaces(auth: TogglTwoAuthValue): Promise<TwoWorkspace[]> {
  const userAccountId = await twoCurrentUserAccountId(auth).catch(() => null);
  if (!isNil(userAccountId)) {
    const users = await twoOrganizationUsers({
      auth,
      perPage: 1,
      queryParams: { user_account_ids: String(userAccountId) },
    });
    const me = users.find((user) => user.user_account_id === userAccountId);
    if (me && me.workspaces.length > 0) {
      return me.workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
      }));
    }
  }
  const settings = await twoSettings(auth);
  return [
    {
      id: settings.current_workspace_id,
      name: `Workspace ${settings.current_workspace_id}`,
    },
  ];
}

async function resolveTwoTagIds({
  auth,
  workspaceId,
  names,
}: {
  auth: TogglTwoAuthValue;
  workspaceId: number;
  names: string[] | undefined;
}): Promise<number[] | undefined> {
  if (isNil(names) || names.length === 0) {
    return undefined;
  }
  const existing = await listTwoPages<TwoTag>({
    auth,
    path: `/workspaces/${workspaceId}/tags`,
  });
  const byName = new Map(
    existing.map((tag) => [tag.name.trim().toLowerCase(), tag.id])
  );
  const uniqueNames = [...new Set(names.map((name) => name.trim()))].filter(
    (name) => name.length > 0
  );
  const ids = await Promise.all(
    uniqueNames.map(async (name) => {
      const found = byName.get(name.toLowerCase());
      if (!isNil(found)) {
        return found;
      }
      const created = await request<TwoTag>({
        auth,
        method: HttpMethod.POST,
        path: `/workspaces/${workspaceId}/tags`,
        body: { name },
      });
      return created.id;
    })
  );
  return ids;
}

function requireId({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number {
  const parsed = parseId(value);
  if (isNil(parsed)) {
    throw new Error(`${label} must be a numeric Toggl ID.`);
  }
  return parsed;
}

function optionalId({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number | undefined {
  if (isNil(value) || value === '') {
    return undefined;
  }
  return requireId({ value, label });
}

function parseId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d{1,15}$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function isPositiveId(value: unknown): boolean {
  return !isNil(parseId(value));
}

function toIsoDateTime({
  value,
  label,
}: {
  value: string;
  label: string;
}): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `${label} is not a valid date. Use YYYY-MM-DD or an ISO 8601 / RFC 3339 timestamp.`
    );
  }
  return date.toISOString();
}

function classicOnlyError(feature: string): Error {
  return new Error(
    `${feature} is only available for Toggl Track (Classic) connections. Toggl 2.0 does not offer this in its public API.`
  );
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response)
  ) {
    return undefined;
  }
  return typeof response.status === 'number' ? response.status : undefined;
}

function errorText(error: unknown): string {
  const status = httpStatusOf(error);
  if (isNil(status)) {
    return error instanceof Error ? error.message : String(error);
  }
  const detail = responseDetail(error);
  return detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`;
}

function responseDetail(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('body' in response)) {
    return null;
  }
  const body = response.body;
  if (typeof body === 'string') {
    return body.slice(0, 300);
  }
  if (typeof body === 'object' && body !== null) {
    if ('error_description' in body && typeof body.error_description === 'string') {
      return body.error_description;
    }
    if ('message' in body && typeof body.message === 'string') {
      return body.message;
    }
  }
  return null;
}

function baseUrl(auth: TogglAuthValue): string {
  return isTwo(auth) ? TWO_BASE_URL : CLASSIC_BASE_URL;
}

function authorizationHeader(auth: TogglAuthValue): string {
  if (isTwo(auth)) {
    return `Bearer ${auth.props.token.trim()}`;
  }
  return `Basic ${Buffer.from(`${auth.secret_text.trim()}:api_token`).toString(
    'base64'
  )}`;
}

const CLASSIC_BASE_URL = 'https://api.track.toggl.com/api/v9';
const TWO_BASE_URL = 'https://focus.toggl.com/api';
const CLASSIC_REPORTS_BASE_URL = 'https://api.track.toggl.com/reports/api/v3';
const TWO_PAGE_SIZE = 100;
const TWO_MAX_PAGES = 50;

export const togglApi = {
  HttpMethod,
  request,
  classicReportsRequest,
  withNotFound,
  listTwoPages,
  listTwoPageOrAll,
  isTwo,
  twoConnection,
  twoOrganizationId,
  twoWorkspacePath,
  twoSettings,
  twoCurrentUserAccountId,
  twoOrganizationUsers,
  twoWorkspaces,
  resolveTwoTagIds,
  requireId,
  optionalId,
  isPositiveId,
  toIsoDateTime,
  classicOnlyError,
  httpStatusOf,
  errorText,
  baseUrl,
  authorizationHeader,
};

type TogglRequest = {
  auth: TogglAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
};

type TogglTwoProps = {
  token: string;
  organization_id: string;
};

type TogglClassicAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};


type TwoSettings = {
  current_workspace_id: number;
};

type TwoWorkspace = {
  id: number;
  name: string;
};

type TwoTag = {
  id: number;
  name: string;
};

export type TogglTwoAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: TogglTwoProps;
};

export type TogglAuthValue = TogglClassicAuthValue | TogglTwoAuthValue;

export type TwoOrganizationUser = {
  id: number;
  user_account_id: number;
  name: string;
  email: string;
  active: boolean;
  joined?: boolean;
  owner?: boolean;
  created_at?: string;
  updated_at?: string;
  workspaces: {
    id: number;
    name: string;
    workspace_user_id: number;
  }[];
};
