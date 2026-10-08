import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, isNil } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../auth';

const ACCOUNT_BASE_URL = 'https://api.maileroo.com/v1';
const INBOUND_ROUTE_FIELDS = [
  'description',
  'expression_type',
  'header_name',
  'header_content',
  'recipient',
  'custom_expression',
  'regex_enabled',
  'forward_list',
  'dmarc_alignment',
  'require_spf',
  'require_dkim',
  'skip_spam_check',
  'stop',
  'priority',
];
const EMAIL_BASE_URL = 'https://smtp.maileroo.com/api/v2';

async function accountRequest<T>({ auth, method, path, queryParams, body }: AccountRequest): Promise<T | { success: true }> {
  assertKeyType({ auth, expected: 'account', label: 'Account Key' });
  const response = await send<{ data?: T }>({
    method,
    url: `${ACCOUNT_BASE_URL}${path}`,
    headers: { Authorization: `Bearer ${auth.props.apiKey}`, 'Content-Type': 'application/json' },
    queryParams,
    body,
  });
  return isNil(response.data) ? { success: true } : response.data;
}

async function emailRequest<T>({ auth, method, path, queryParams, body }: AccountRequest): Promise<EmailEnvelope<T>> {
  assertKeyType({ auth, expected: 'sending', label: 'Sending Key' });
  const response = await send<EmailEnvelope<T>>({
    method,
    url: `${EMAIL_BASE_URL}${path}`,
    headers: { 'X-API-Key': auth.props.apiKey, 'Content-Type': 'application/json' },
    queryParams,
    body,
  });
  if (response.success === false) {
    throw new Error(response.message);
  }
  return response;
}

function toQuery(values: Record<string, string | number | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter((entry): entry is [string, string | number] => !isNil(entry[1]))
      .map(([key, value]) => [key, String(value)]),
  );
}

function optionalBoolean(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function toStrings(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === 'string');
}

function pickInboundRouteFields(route: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(INBOUND_ROUTE_FIELDS.filter((field) => field in route).map((field) => [field, route[field]]));
}

async function send<T>({ method, url, headers, queryParams, body }: SendRequest): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({ method, url, headers, queryParams, body });
    return response.body;
  } catch (error) {
    throw toReadableError(error);
  }
}

function toReadableError(error: unknown): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const payload = error.response.body;
  const vendorMessage = extractMessage(payload);
  return new Error(`Maileroo API error ${status}: ${vendorMessage}`);
}

function extractMessage(payload: unknown): string {
  if (typeof payload === 'object' && !isNil(payload)) {
    if ('error' in payload && typeof payload.error === 'object' && !isNil(payload.error) && 'message' in payload.error) {
      return String(payload.error.message);
    }
    if ('message' in payload) {
      return String(payload.message);
    }
  }
  return typeof payload === 'string' ? payload : 'Unknown error';
}

function assertKeyType({ auth, expected, label }: { auth: MailerooAuth; expected: 'sending' | 'account'; label: string }): void {
  if (auth.props.keyType !== expected) {
    throw new Error(`This action requires a connection with a ${label}. Reconnect Maileroo and choose "${label}" as the key type.`);
  }
}

export const mailerooClient = { accountRequest, emailRequest, toQuery, optionalBoolean, toStrings, pickInboundRouteFields };

export type MailerooAuth = AppConnectionValueForAuthProperty<typeof mailerooAuth>;
export type EmailEnvelope<T> = { success: boolean; message: string; data: T };
type AccountRequest = {
  auth: MailerooAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
};
type SendRequest = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: Record<string, unknown>;
};
