import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';

function getBaseUrl(region: string): string {
  return region === 'eu'
    ? 'https://api.eu.mailgun.net'
    : 'https://api.mailgun.net';
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
  await mailgunApiCall({
    apiKey,
    region,
    method: HttpMethod.POST,
    path: `/v3/domains/${domain}/webhooks`,
    body: {
      id: eventType,
      url: [webhookUrl],
    },
  });
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
  await mailgunApiCall({
    apiKey,
    region,
    method: HttpMethod.DELETE,
    path: `/v3/domains/${domain}/webhooks/${eventType}`,
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
      const authValue = auth as { props: { api_key: string; region: string } };
      const response = await mailgunApiCall<{
        items: { name: string; state: string }[];
      }>({
        apiKey: authValue.props.api_key,
        region: authValue.props.region,
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
      const authValue = auth as { props: { api_key: string; region: string } };
      const response = await mailgunApiCall<{
        items: { address: string; name: string; members_count: number }[];
      }>({
        apiKey: authValue.props.api_key,
        region: authValue.props.region,
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
