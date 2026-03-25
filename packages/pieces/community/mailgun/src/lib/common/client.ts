import {
  AuthenticationType,
  HttpMessageBody,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { MAILGUN_EU_BASE_URL, MAILGUN_US_BASE_URL, MailgunAuth } from '../auth';

export type MailgunSendResponse = Record<string, unknown>;
export type MailgunListResponse = Record<string, unknown>;
export type MailgunDomainResponse = Record<string, unknown>;
export type MailgunEventResponse = Record<string, unknown>;
export type MailgunStoredMessageResponse = Record<string, unknown>;

export function getMailgunBaseUrl(auth: MailgunAuth): string {
  return auth.region === 'EU' ? MAILGUN_EU_BASE_URL : MAILGUN_US_BASE_URL;
}

export function createMailgunClient(auth: MailgunAuth) {
  const mailgun = new Mailgun(FormData);
  return mailgun.client({
    username: 'api',
    key: auth.apiKey,
    url: getMailgunBaseUrl(auth),
  });
}

export async function mailgunApiCall<T extends HttpMessageBody>(
  auth: MailgunAuth,
  method: HttpMethod,
  resourceUri: string,
  body?: unknown
): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${getMailgunBaseUrl(auth)}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: 'api',
      password: auth.apiKey,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
