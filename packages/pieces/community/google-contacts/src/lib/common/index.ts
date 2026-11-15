import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const apiRoot = 'https://people.googleapis.com/v1';

const contactReadMask = [
  'names',
  'nicknames',
  'emailAddresses',
  'phoneNumbers',
  'organizations',
  'addresses',
  'biographies',
  'urls',
  'memberships',
  'photos',
  'metadata',
];

const contactGroupFields = [
  'clientData',
  'groupType',
  'memberCount',
  'metadata',
  'name',
];

const updatablePersonFields = [
  'addresses',
  'biographies',
  'birthdays',
  'calendarUrls',
  'clientData',
  'emailAddresses',
  'events',
  'externalIds',
  'genders',
  'imClients',
  'interests',
  'locales',
  'locations',
  'memberships',
  'miscKeywords',
  'names',
  'nicknames',
  'occupations',
  'organizations',
  'phoneNumbers',
  'relations',
  'sipAddresses',
  'urls',
  'userDefined',
];

const systemGroupsRejectingAdds = [
  'contactGroups/all',
  'contactGroups/blocked',
  'contactGroups/chatBuddies',
  'contactGroups/coworkers',
  'contactGroups/family',
  'contactGroups/friends',
];

function buildUrl({
  path,
  queryParams,
  repeatedQueryParams,
}: {
  path: string;
  queryParams?: Record<string, string | undefined>;
  repeatedQueryParams?: Record<string, string[]>;
}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value !== undefined) {
      search.append(key, value);
    }
  }
  for (const [key, values] of Object.entries(repeatedQueryParams ?? {})) {
    for (const value of values) {
      search.append(key, value);
    }
  }
  const query = search.toString();
  return query.length > 0 ? `${apiRoot}${path}?${query}` : `${apiRoot}${path}`;
}

function readValue({ source, path }: { source: unknown; path: string[] }): unknown {
  let current: unknown = source;
  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }
    current = Reflect.get(current, key);
  }
  return current;
}

function readString({
  source,
  path,
}: {
  source: unknown;
  path: string[];
}): string | undefined {
  const value = readValue({ source, path });
  return typeof value === 'string' ? value : undefined;
}

function readRecord({
  source,
  path,
}: {
  source: unknown;
  path: string[];
}): Record<string, unknown> | undefined {
  const value = readValue({ source, path });
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(value));
}

function readArray({ source, path }: { source: unknown; path: string[] }): unknown[] {
  const value = readValue({ source, path });
  return Array.isArray(value) ? value : [];
}

function parseStringList({ value, label }: { value: string; label: string }): unknown[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    throw new Error(`${label} must be a list of strings.`);
  }
  throw new Error(`${label} must be a list of strings.`);
}

function toStringList({ value, label }: { value: unknown; label: string }): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  const entries =
    typeof value === 'string' ? parseStringList({ value, label }) : value;
  if (!Array.isArray(entries)) {
    throw new Error(`${label} must be a list of strings.`);
  }
  return entries.map((item) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`${label} must be a list of non-empty strings.`);
    }
    return item.trim();
  });
}

function assertBatchSize({
  values,
  max,
  label,
}: {
  values: string[];
  max: number;
  label: string;
}): void {
  if (values.length === 0) {
    throw new Error(`${label} must contain at least one entry.`);
  }
  if (values.length > max) {
    throw new Error(
      `${label} accepts at most ${max} entries, received ${values.length}.`
    );
  }
}

function describeStatus({ status }: { status: unknown }): string {
  const message = readString({ source: status, path: ['message'] });
  const code = readValue({ source: status, path: ['code'] });
  if (message !== undefined) {
    return message;
  }
  if (typeof code === 'number') {
    return `Google returned status code ${code}.`;
  }
  return 'Google returned an unspecified failure for this item.';
}

function isFailedItem({ response }: { response: unknown }): boolean {
  const status = readValue({ source: response, path: ['status'] });
  if (status === undefined || status === null) {
    return false;
  }
  const code = readValue({ source: status, path: ['code'] });
  const message = readValue({ source: status, path: ['message'] });
  if (typeof code === 'number' && code !== 0) {
    return true;
  }
  return typeof message === 'string' && message.length > 0;
}

function splitItemResponses({
  items,
  payloadKey,
}: {
  items: { resourceName: string; response: unknown }[];
  payloadKey: string;
}): {
  succeeded: { resourceName: string; payload: unknown }[];
  failed: { resourceName: string; status: string }[];
} {
  const succeeded = items
    .filter((item) => !isFailedItem({ response: item.response }))
    .map((item) => ({
      resourceName:
        readString({
          source: item.response,
          path: [payloadKey, 'resourceName'],
        }) ?? item.resourceName,
      payload: readValue({ source: item.response, path: [payloadKey] }),
    }));
  const failed = items
    .filter((item) => isFailedItem({ response: item.response }))
    .map((item) => ({
      resourceName: item.resourceName,
      status: describeStatus({
        status: readValue({ source: item.response, path: ['status'] }),
      }),
    }));
  return { succeeded, failed };
}

function toApiError({
  error,
  operation,
}: {
  error: unknown;
  operation: string;
}): Error {
  const status = readValue({ source: error, path: ['response', 'status'] });
  const reason = readString({
    source: error,
    path: ['response', 'body', 'error', 'status'],
  });
  const message = readString({
    source: error,
    path: ['response', 'body', 'error', 'message'],
  });
  const suffix = message === undefined ? '' : ` ${message}`;
  if (status === 400 && reason === 'FAILED_PRECONDITION') {
    return new Error(
      `${operation} failed because the record changed since it was read. Re-read the record to get a fresh etag and retry.${suffix}`
    );
  }
  if (status === 400) {
    return new Error(
      `${operation} was rejected as invalid by Google Contacts.${suffix}`
    );
  }
  if (status === 401) {
    return new Error(
      `${operation} failed: the Google Contacts connection is no longer authorized. Reconnect the account.${suffix}`
    );
  }
  if (status === 403) {
    return new Error(
      `${operation} failed: the connected Google account is not allowed to perform it, or the connection is missing the required scope.${suffix}`
    );
  }
  if (status === 404) {
    return new Error(
      `${operation} failed: the resource was not found. Resource names are opaque, so resolve a current one with the matching list or search action.${suffix}`
    );
  }
  if (status === 409) {
    return new Error(`${operation} failed: the resource already exists.${suffix}`);
  }
  if (status === 429) {
    return new Error(
      `${operation} failed: Google Contacts rate limit reached. Retry later.${suffix}`
    );
  }
  return new Error(`${operation} failed.${suffix}`);
}

function isConflict({ error }: { error: unknown }): boolean {
  return readValue({ source: error, path: ['response', 'status'] }) === 409;
}

async function sendRequest({
  accessToken,
  method,
  path,
  queryParams,
  repeatedQueryParams,
  body,
}: {
  accessToken: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  repeatedQueryParams?: Record<string, string[]>;
  body?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const request: HttpRequest<Record<string, unknown>> = {
    method,
    url: buildUrl({ path, queryParams, repeatedQueryParams }),
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  };
  const response = await httpClient.sendRequest<Record<string, unknown>>(request);
  return response.body ?? {};
}

export const googleContactsCommon = {
  baseUrl: `https://people.googleapis.com/v1/people`,
};

export const googleContactsApi = {
  contactReadMask,
  contactGroupFields,
  updatablePersonFields,
  systemGroupsRejectingAdds,
  sendRequest,
  toApiError,
  isConflict,
  readValue,
  readString,
  readRecord,
  readArray,
  toStringList,
  assertBatchSize,
  splitItemResponses,
  describeStatus,
  isFailedItem,
};
