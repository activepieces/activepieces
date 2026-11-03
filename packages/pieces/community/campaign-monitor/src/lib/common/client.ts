import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.createsend.com/api/v3.3';

export async function makeRequest<T>({
  auth,
  method,
  path,
  body,
}: {
  auth: CampaignMonitorAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
}) {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.apiKey,
      password: 'x',
    },
    body,
  });
  return response;
}

export function transformCustomFields(
  inputFields: Array<{ Key: string; Value: string }> | undefined
) {
  const fields: Record<string, string | string[]> = {};

  for (const { Key, Value } of inputFields ?? []) {
    const key = Key.replace(/^\[(.*)\]$/, '$1');
    const existing = fields[key];
    if (existing === undefined) {
      fields[key] = Value;
    } else if (Array.isArray(existing)) {
      existing.push(Value);
    } else {
      fields[key] = [existing, Value];
    }
  }
  return fields;
}

export async function fetchDateFieldKeys({
  auth,
  listId,
}: {
  auth: CampaignMonitorAuth;
  listId: string;
}) {
  const response = await makeRequest<
    Array<{ Key: string; DataType: string }>
  >({
    auth,
    method: HttpMethod.GET,
    path: `/lists/${encodeURIComponent(listId)}/customfields.json`,
  });
  return new Set(
    (response.body ?? [])
      .filter((field) => field.DataType === 'Date')
      .map((field) => field.Key)
  );
}

export function buildCustomFieldsPayload({
  fields,
  dateKeys,
}: {
  fields: Record<string, unknown> | undefined;
  dateKeys: Set<string>;
}) {
  return Object.entries(fields ?? {}).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value
        .filter((v) => !isBlank(v))
        .map((v) => ({ Key: key, Value: v }));
    }
    if (isBlank(value)) {
      return [];
    }
    return [
      {
        Key: key,
        Value: dateKeys.has(key) ? toDateFieldValue(value) : value,
      },
    ];
  });
}

export function isSubscriberNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  const status = 'status' in response ? response.status : undefined;
  if (status === 404) {
    return true;
  }
  const body = 'body' in response ? response.body : undefined;
  return (
    status === 400 &&
    typeof body === 'object' &&
    body !== null &&
    'Code' in body &&
    Number(body.Code) === 203
  );
}

export function getApiErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('body' in response)
  ) {
    return undefined;
  }
  const body = response.body;
  if (typeof body !== 'object' || body === null || !('Code' in body)) {
    return undefined;
  }
  return Number(body.Code);
}

export function clampPageSize(value: number | undefined) {
  const size = Number(value ?? 100);
  if (!Number.isFinite(size)) {
    return 100;
  }
  return Math.min(1000, Math.max(10, Math.floor(size)));
}

export function clampPage(value: number | undefined) {
  const page = Number(value ?? 1);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

export async function fetchSubscriberOrEventData({
  apiKey,
  listId,
  event,
}: {
  apiKey: string;
  listId: string;
  event: CampaignMonitorWebhookEvent;
}) {
  try {
    const response = await makeRequest<
      Record<string, unknown> & {
        CustomFields?: Array<{ Key: string; Value: string }>;
      }
    >({
      auth: { apiKey },
      method: HttpMethod.GET,
      path: `/subscribers/${listId}.json?email=${encodeURIComponent(
        event.EmailAddress
      )}&includetrackingpreference=true`,
    });
    return {
      ...response.body,
      State: event.State ?? response.body['State'],
      CustomFields: transformCustomFields(response.body.CustomFields),
    };
  } catch (error) {
    if (!isSubscriberNotFoundError(error)) {
      throw error;
    }
    return {
      EmailAddress: event.EmailAddress,
      Name: event.Name ?? null,
      Date: event.Date ?? null,
      State: event.State ?? null,
      CustomFields: transformCustomFields(event.CustomFields),
    };
  }
}

export function jsonCustomFieldsToRecord(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      'Custom Fields must be a JSON object, e.g. {"Company":"Acme","Age":30}.'
    );
  }
  const fields: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(parsed)) {
    const name = key.replace(/^\s*\[(.*)\]\s*$/, '$1').replace(/\s+/g, '');
    if (name.length === 0) {
      continue;
    }
    fields[`[${name}]`] = fieldValue;
  }
  return fields;
}

const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}/;

function toDateFieldValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  const match = ISO_DATE_TIME.exec(value);
  return match ? `${match[1]}/${match[2]}/${match[3]}` : value;
}

function isBlank(value: unknown) {
  return value === undefined || value === null || value === '';
}

export interface CampaignMonitorAuth {
  apiKey: string;
}

export interface CampaignMonitorWebhookEvent {
  Type: string;
  EmailAddress: string;
  Name?: string;
  Date?: string;
  State?: string;
  CustomFields?: Array<{ Key: string; Value: string }>;
}
