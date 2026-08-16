import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import type { MpesaAuthValue } from '../auth';

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const;

export function mpesaBaseUrl(environment: MpesaAuthValue['environment']): string {
  return BASE_URLS[environment];
}

export async function getAccessToken(auth: MpesaAuthValue): Promise<string> {
  const response = await httpClient.sendRequest<{ access_token: string }>({
    method: HttpMethod.GET,
    url: `${mpesaBaseUrl(auth.environment)}/oauth/v1/generate?grant_type=client_credentials`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.consumerKey,
      password: auth.consumerSecret,
    },
  });

  if (!response.body.access_token) {
    throw new Error('M-Pesa did not return an OAuth access token. Check the Consumer Key, Consumer Secret, and environment.');
  }
  return response.body.access_token;
}

export async function mpesaPost<T>(auth: MpesaAuthValue, path: string, body: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken(auth);
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${mpesaBaseUrl(auth.environment)}${path}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export function darajaTimestamp(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}${value('month')}${value('day')}${value('hour')}${value('minute')}${value('second')}`;
}

export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  throw new Error('Phone number must be a valid Kenyan Safaricom number, for example 0712345678 or 254712345678.');
}

export function positiveInteger(amount: number, label = 'Amount'): number {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error(`${label} must be a positive whole number.`);
  return amount;
}
