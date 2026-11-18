import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function vendorMessage(body: unknown): string {
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  if (isRecord(body)) {
    for (const key of ['message', 'error']) {
      const value = body[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
  }
  return 'No details returned by Loops.';
}

function describeStatus({ status, body }: { status: number; body: unknown }): string {
  const detail = vendorMessage(body);
  if (status === 400) {
    return `Loops rejected the request (400): ${detail}`;
  }
  if (status === 401) {
    return `Loops rejected the API key (401): ${detail}`;
  }
  if (status === 403) {
    return `The API key is not allowed to perform this request (403): ${detail}`;
  }
  if (status === 404) {
    return `Loops could not find the requested resource (404): ${detail}`;
  }
  if (status === 405) {
    return `Loops does not accept this HTTP method for the endpoint (405): ${detail}`;
  }
  if (status === 409) {
    return `Loops reported a conflict (409): ${detail}`;
  }
  if (status === 429) {
    return `Loops rate limit reached (429). Wait a moment and retry: ${detail}`;
  }
  if (status >= 500) {
    return `Loops is having a server problem (${status}). Retry later: ${detail}`;
  }
  return `Loops request failed (${status}): ${detail}`;
}

async function request<T>({
  apiKey,
  method,
  path,
  queryParams,
  body,
  idempotencyKey,
}: LoopsRequestParams): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${LOOPS_BASE_URL}${path}`,
      headers,
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const { status, body: responseBody } = error.response;
      throw new LoopsApiError({ status, responseBody });
    }
    throw error;
  }
}

async function findContacts({
  apiKey,
  queryParams,
}: {
  apiKey: string;
  queryParams: Record<string, string>;
}): Promise<unknown[]> {
  const body = await request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/contacts/find',
    queryParams,
  });
  if (!Array.isArray(body)) {
    throw new Error(`Loops returned an unexpected response for contact search: ${JSON.stringify(body)}`);
  }
  return body;
}

function sliceArray({
  items,
  offset,
  limit,
  what,
}: {
  items: unknown;
  offset: number | undefined;
  limit: number | undefined;
  what: string;
}): unknown[] {
  if (!Array.isArray(items)) {
    throw new Error(`Loops returned an unexpected response for ${what}: ${JSON.stringify(items)}`);
  }
  const start = Math.max(0, Math.trunc(offset ?? 0));
  if (limit === undefined || limit === null) {
    return items.slice(start);
  }
  return items.slice(start, start + Math.max(0, Math.trunc(limit)));
}

function buildContactBody({
  base,
  props,
}: {
  base: Record<string, unknown>;
  props: ContactBodyProps;
}): Record<string, unknown> {
  const body: Record<string, unknown> = { ...base };
  const { firstName, lastName, subscribed, userGroup, source, mailingLists, customProperties } = props;
  if (firstName) body['firstName'] = firstName;
  if (lastName) body['lastName'] = lastName;
  if (subscribed === 'true') body['subscribed'] = true;
  if (subscribed === 'false') body['subscribed'] = false;
  if (userGroup) body['userGroup'] = userGroup;
  if (source) body['source'] = source;
  if (isRecord(mailingLists) && Object.keys(mailingLists).length > 0) {
    body['mailingLists'] = mailingLists;
  }
  if (isRecord(customProperties)) {
    for (const [key, value] of Object.entries(customProperties)) {
      if (!RESERVED_CONTACT_FIELDS.has(key)) {
        body[key] = value;
      }
    }
  }
  return body;
}

function requireOneIdentifier({
  identifyBy,
  value,
}: {
  identifyBy: string | undefined;
  value: string | undefined;
}): Record<string, string> {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    throw new Error('Provide the email address or user ID to identify the contact.');
  }
  if (identifyBy === 'userId') {
    return { userId: trimmed };
  }
  if (identifyBy === 'email') {
    return { email: trimmed };
  }
  throw new Error('Choose whether to identify the contact by "email" or "userId".');
}

class LoopsApiError extends Error {
  public readonly status: number;
  public readonly responseBody: unknown;

  constructor({ status, responseBody }: { status: number; responseBody: unknown }) {
    super(describeStatus({ status, body: responseBody }));
    this.name = 'LoopsApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const LOOPS_BASE_URL = 'https://app.loops.so/api/v1';

export const RESERVED_CONTACT_FIELDS = new Set([
  'email',
  'firstName',
  'lastName',
  'userId',
  'subscribed',
  'userGroup',
  'source',
  'mailingLists',
]);

export const loopsClient = {
  request,
  findContacts,
  sliceArray,
  buildContactBody,
  requireOneIdentifier,
  isRecord,
  describeStatus,
  RESERVED_CONTACT_FIELDS,
};

export { LoopsApiError };

type LoopsRequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
  idempotencyKey?: string;
};

type ContactBodyProps = {
  firstName?: string;
  lastName?: string;
  subscribed?: string;
  userGroup?: string;
  source?: string;
  mailingLists?: unknown;
  customProperties?: unknown;
};
