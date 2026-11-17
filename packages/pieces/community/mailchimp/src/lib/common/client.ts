import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { mailchimpCommon } from '.';

const REQUEST_TIMEOUT_MS = 60000;
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

function readHttpFailure(
  error: unknown
): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response) ||
    typeof response.status !== 'number'
  ) {
    return null;
  }
  return {
    status: response.status,
    body: 'body' in response ? response.body : undefined,
  };
}

function readText({ value, key }: { value: unknown; key: string }): string {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return '';
  }
  const entry = Object.entries(value).find(([name]) => name === key);
  return entry && typeof entry[1] === 'string' ? entry[1] : '';
}

function describeVendorBody(body: unknown): string {
  if (typeof body === 'string') {
    return body.slice(0, 500);
  }
  const title = readText({ value: body, key: 'title' });
  const detail = readText({ value: body, key: 'detail' });
  const parts = [title, detail].filter((part) => part.length > 0);
  if (typeof body === 'object' && body !== null && 'errors' in body && Array.isArray(body.errors)) {
    const fieldErrors = body.errors
      .slice(0, 5)
      .map((item: unknown) => {
        const field = readText({ value: item, key: 'field' });
        const message = readText({ value: item, key: 'message' });
        return field ? `${field}: ${message}` : message;
      })
      .filter((text: string) => text.length > 0);
    if (fieldErrors.length > 0) {
      parts.push(fieldErrors.join('; '));
    }
  }
  return parts.join(' - ');
}

function toMailchimpError({
  error,
  operation,
  method,
}: {
  error: unknown;
  operation: string;
  method: HttpMethod;
}): MailchimpApiError {
  const failure = readHttpFailure(error);
  if (failure) {
    const detail = describeVendorBody(failure.body);
    return new MailchimpApiError({
      message: `Mailchimp ${operation} failed (HTTP ${failure.status})${detail ? `: ${detail}` : ''}`,
      status: failure.status,
      responseBody: failure.body,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const mayHaveApplied =
    method === HttpMethod.GET
      ? ''
      : ' The request may still have been applied in Mailchimp; check before retrying.';
  return new MailchimpApiError({
    message: `Mailchimp ${operation} failed: ${reason}.${mayHaveApplied}`,
    status: 0,
    responseBody: null,
  });
}

function cleanQuery(
  queryParams: Record<string, string | number | boolean | undefined> | undefined
): QueryParams {
  const result: QueryParams = {};
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value === undefined || value === '') {
      continue;
    }
    result[key] = String(value);
  }
  return result;
}

function createMailchimpClient({ accessToken }: { accessToken: string }) {
  let serverPrefix: Promise<string> | null = null;

  const getServer = (): Promise<string> => {
    if (serverPrefix === null) {
      serverPrefix = mailchimpCommon.getMailChimpServerPrefix(accessToken);
    }
    return serverPrefix;
  };

  const request = async <T>({
    method,
    path,
    body,
    queryParams,
    operation,
  }: MailchimpRequestParams): Promise<T> => {
    let server: string;
    try {
      server = await getServer();
    } catch (error) {
      throw toMailchimpError({
        error,
        operation: `${operation} (data center lookup)`,
        method: HttpMethod.GET,
      });
    }
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `https://${server}.api.mailchimp.com/3.0${path}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        headers: { Accept: 'application/json' },
        body,
        queryParams: cleanQuery(queryParams),
        timeout: REQUEST_TIMEOUT_MS,
      });
      return response.body;
    } catch (error) {
      throw toMailchimpError({ error, operation, method });
    }
  };

  const requestOrNotFound = async <T>(
    params: MailchimpRequestParams
  ): Promise<T | null> => {
    try {
      return await request<T>(params);
    } catch (error) {
      if (error instanceof MailchimpApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const listAll = async <T>({
    path,
    itemsKey,
    queryParams,
    operation,
  }: ListAllParams): Promise<T[]> => {
    const items: T[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * PAGE_SIZE;
      const body = await request<Record<string, unknown>>({
        method: HttpMethod.GET,
        path,
        queryParams: { ...queryParams, count: PAGE_SIZE, offset },
        operation,
      });
      const pageItems = body[itemsKey];
      const list: T[] = Array.isArray(pageItems) ? pageItems : [];
      items.push(...list);
      const total =
        typeof body['total_items'] === 'number' ? body['total_items'] : items.length;
      if (list.length < PAGE_SIZE || items.length >= total) {
        return items;
      }
    }
    throw new MailchimpApiError({
      message: `Mailchimp ${operation} returned more than ${MAX_PAGES * PAGE_SIZE} items; narrow the request.`,
      status: 0,
      responseBody: null,
    });
  };

  return { request, requestOrNotFound, listAll };
}

function readPaging({
  count,
  offset,
  defaultCount,
}: {
  count: number | undefined | null;
  offset: number | undefined | null;
  defaultCount: number;
}): { count: number; offset: number } {
  const safeCount = count === undefined || count === null ? defaultCount : Math.trunc(Number(count));
  const safeOffset = offset === undefined || offset === null ? 0 : Math.trunc(Number(offset));
  if (!Number.isFinite(safeCount) || safeCount < 1 || safeCount > PAGE_SIZE) {
    throw new Error(`Limit must be between 1 and ${PAGE_SIZE}.`);
  }
  if (!Number.isFinite(safeOffset) || safeOffset < 0) {
    throw new Error('Offset must be 0 or greater.');
  }
  return { count: safeCount, offset: safeOffset };
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text.length > 0 ? text : undefined;
}

function parseJsonObject({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value));
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a JSON object.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON, for example {"FNAME":"Ada"}.`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object, for example {"FNAME":"Ada"}.`);
  }
  return Object.fromEntries(Object.entries(parsed));
}

function toStringList(value: unknown): string[] {
  const raw: unknown[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  const result: string[] = [];
  for (const item of raw) {
    const text = typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : '';
    if (text.length > 0 && !result.includes(text)) {
      result.push(text);
    }
  }
  return result;
}

function memberPath({ listId, email }: { listId: string; email: string }): string {
  return `/lists/${encodeURIComponent(listId)}/members/${mailchimpCommon.getMD5EmailHash(email.trim())}`;
}

function matchByName<T>({
  items,
  query,
  names,
}: {
  items: T[];
  query: string;
  names: (item: T) => string[];
}): T[] {
  const needle = query.trim().toLowerCase();
  const exact = items.filter((item) =>
    names(item).some((name) => name.trim().toLowerCase() === needle)
  );
  if (exact.length > 0) {
    return exact;
  }
  return items.filter((item) =>
    names(item).some((name) => name.toLowerCase().includes(needle))
  );
}

function toMemberSummary(member: ApiMember) {
  return {
    id: member.id,
    email_address: member.email_address,
    full_name: member.full_name ?? null,
    status: member.status,
    list_id: member.list_id,
    member_rating: member.member_rating ?? null,
    vip: member.vip ?? false,
    language: member.language ?? null,
    timestamp_signup: member.timestamp_signup || null,
    last_changed: member.last_changed || null,
    tags: (member.tags ?? []).map((tag) => ({ id: tag.id, name: tag.name })),
    merge_fields: member.merge_fields ?? {},
  };
}

function toCampaignSummary(campaign: ApiCampaign) {
  return {
    id: campaign.id,
    web_id: campaign.web_id,
    type: campaign.type,
    status: campaign.status,
    title: campaign.settings?.title ?? null,
    subject_line: campaign.settings?.subject_line ?? null,
    list_id: campaign.recipients?.list_id ?? null,
    emails_sent: campaign.emails_sent ?? 0,
    create_time: campaign.create_time || null,
    send_time: campaign.send_time || null,
    archive_url: campaign.archive_url || null,
  };
}

class MailchimpApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: MailchimpApiErrorParams) {
    super(message);
    this.name = 'MailchimpApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

type MailchimpApiErrorParams = {
  message: string;
  status: number;
  responseBody: unknown;
};

type MailchimpRequestParams = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
  operation: string;
};

type ListAllParams = {
  path: string;
  itemsKey: string;
  queryParams?: Record<string, string | number | boolean | undefined>;
  operation: string;
};

export type ApiMember = {
  id: string;
  email_address: string;
  full_name?: string;
  status: string;
  list_id: string;
  member_rating?: number;
  vip?: boolean;
  language?: string;
  timestamp_signup?: string;
  last_changed?: string;
  tags?: { id: number; name: string }[];
  merge_fields?: Record<string, unknown>;
};

export type ApiCampaign = {
  id: string;
  web_id: number;
  type: string;
  status: string;
  emails_sent?: number;
  create_time?: string;
  send_time?: string;
  archive_url?: string;
  settings?: { title?: string; subject_line?: string };
  recipients?: { list_id?: string; segment_opts?: { saved_segment_id?: number } };
};

export type MailchimpClient = ReturnType<typeof createMailchimpClient>;

export const mailchimpApi = {
  createClient: createMailchimpClient,
  readPaging,
  requireText,
  optionalText,
  parseJsonObject,
  toStringList,
  memberPath,
  matchByName,
  toMailchimpError,
  toMemberSummary,
  toCampaignSummary,
};

export { MailchimpApiError };
