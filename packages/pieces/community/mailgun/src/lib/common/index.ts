import { createHmac, timingSafeEqual } from 'crypto';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
  HttpError,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { mailgunAuth } from '../..';

export function verifyMailgunSignature(
  apiKey: string,
  timestamp: string,
  token: string,
  signature: string,
): boolean {
  const expected = createHmac('sha256', apiKey)
    .update(timestamp + token)
    .digest('hex');
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function mailgunApiCall<T extends HttpMessageBody>({
  apiKey,
  region,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  apiKey: string;
  region: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${getBaseUrl(region)}${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: 'api',
      password: apiKey,
    },
    queryParams,
    body,
    headers,
  });
}

export async function subscribeWebhook({
  apiKey,
  region,
  domain,
  eventType,
  webhookUrl,
}: {
  apiKey: string;
  region: string;
  domain: string;
  eventType: string;
  webhookUrl: string;
}): Promise<void> {
  const formHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const { error } = await tryCatch(() =>
    mailgunApiCall({
      apiKey,
      region,
      method: HttpMethod.POST,
      path: `/v3/domains/${domain}/webhooks`,
      body: new URLSearchParams({ id: eventType, url: webhookUrl }).toString(),
      headers: formHeaders,
    }),
  );

  if (error) {
    // Webhook already exists — update it with PUT instead
    await mailgunApiCall({
      apiKey,
      region,
      method: HttpMethod.PUT,
      path: `/v3/domains/${domain}/webhooks/${eventType}`,
      body: new URLSearchParams({ url: webhookUrl }).toString(),
      headers: formHeaders,
    });
  }
}

export async function unsubscribeWebhook({
  apiKey,
  region,
  domain,
  eventType,
}: {
  apiKey: string;
  region: string;
  domain: string;
  eventType: string;
}): Promise<void> {
  const { error } = await tryCatch(() =>
    mailgunApiCall({
      apiKey,
      region,
      method: HttpMethod.DELETE,
      path: `/v3/domains/${domain}/webhooks/${eventType}`,
    }),
  );

  // 404 means the webhook was already removed — ignore it
  if (error && error instanceof HttpError && error.response.status === 404) {
    return;
  }
  if (error) {
    throw error;
  }
}

export async function mailgunApiCallAbsoluteUrl<T extends HttpMessageBody>({
  apiKey,
  url,
}: {
  apiKey: string;
  url: string;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    authentication: {
      type: AuthenticationType.BASIC,
      username: 'api',
      password: apiKey,
    },
  });
}

export const mailgunCommon = {
  domainDropdown: Property.Dropdown({
    displayName: 'Domain',
    description: 'Select the Mailgun domain to use',
    refreshers: [],
    required: true,
    auth: mailgunAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Mailgun account first',
        };
      }
      const response = await mailgunApiCall<{
        items: { name: string; state: string }[];
      }>({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        method: HttpMethod.GET,
        path: '/v3/domains',
        queryParams: { limit: '1000' },
      });
      return {
        disabled: false,
        options: response.body.items.map((domain) => ({
          label: `${domain.name} (${domain.state})`,
          value: domain.name,
        })),
      };
    },
  }),
  mailingListDropdown: Property.Dropdown({
    displayName: 'Mailing List',
    description: 'Select the mailing list',
    refreshers: [],
    required: true,
    auth: mailgunAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Mailgun account first',
        };
      }
      const response = await mailgunApiCall<{
        items: { address: string; name: string; members_count: number }[];
      }>({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        method: HttpMethod.GET,
        path: '/v3/lists/pages',
        queryParams: { limit: '100' },
      });
      return {
        disabled: false,
        options: response.body.items.map((list) => ({
          label: list.name
            ? `${list.name} (${list.address})`
            : list.address,
          value: list.address,
        })),
      };
    },
  }),
};

function getBaseUrl(region: string): string {
  return region === 'eu'
    ? 'https://api.eu.mailgun.net'
    : 'https://api.mailgun.net';
}
