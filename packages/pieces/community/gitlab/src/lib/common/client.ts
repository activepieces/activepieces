import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  GitlabQueryValue,
  GitlabRequest,
  sendGitlabRequest,
} from './secret-request';

export function gitlabToken(auth: GitlabAuthValue): string {
  return getAccessTokenOrThrow(auth);
}

export function encodeSegment({
  value,
  label,
}: {
  value: string | number;
  label: string;
}): string {
  const text = String(value).trim();
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..') {
    throw new Error(`${label} is not valid.`);
  }
  return encodeURIComponent(text);
}

export function filePathSegment(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('File Path is required.');
  }
  if (value === '.' || value === '..') {
    throw new Error('File Path is not valid.');
  }
  return encodeURIComponent(value);
}

export function projectPath(projectId: string | number): string {
  return `/projects/${encodeSegment({
    value: projectId,
    label: 'Project ID or path',
  })}`;
}

export async function gitlabRequest<T>({
  auth,
  ...call
}: GitlabCall & { auth: GitlabAuthValue }): Promise<T> {
  const response = await sendGitlabRequest<T>({
    ...call,
    token: gitlabToken(auth),
  });
  return response.body;
}

function headerInt({
  headers,
  name,
}: {
  headers: Headers;
  name: string;
}): number | null {
  const raw = headers.get(name);
  if (raw === null || raw.trim() === '') {
    return null;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function gitlabListPage<T>({
  auth,
  path,
  query,
  page,
  perPage,
  statusMessages,
}: {
  auth: GitlabAuthValue;
  path: string;
  query?: Record<string, GitlabQueryValue>;
  page?: number;
  perPage?: number;
  statusMessages?: Partial<Record<number, string>>;
}): Promise<GitlabPage<T>> {
  const currentPage = page ?? 1;
  const response = await sendGitlabRequest<T[]>({
    token: gitlabToken(auth),
    method: 'GET',
    path,
    query: { ...query, page: currentPage, per_page: perPage ?? 20 },
    statusMessages,
  });
  const items = Array.isArray(response.body) ? response.body : [];
  const nextPage = headerInt({
    headers: response.headers,
    name: 'x-next-page',
  });
  return {
    items,
    count: items.length,
    page: currentPage,
    nextPage,
    hasMore: nextPage !== null,
    total: headerInt({ headers: response.headers, name: 'x-total' }),
  };
}

export type GitlabAuthValue = OAuth2PropertyValue;

export type GitlabCall = Omit<GitlabRequest, 'token'>;

export type GitlabPage<T> = {
  items: T[];
  count: number;
  page: number;
  nextPage: number | null;
  hasMore: boolean;
  total: number | null;
};
