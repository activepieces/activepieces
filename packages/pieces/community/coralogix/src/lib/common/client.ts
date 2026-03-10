import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { coralogixAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type CoralogixApiType = 'management' | 'ingestion';

export const MANAGEMENT_DOMAIN: Record<string, string> = {
  'eu1.coralogix.com': 'api.coralogix.com',
  'eu2.coralogix.com': 'api.eu2.coralogix.com',
  'us1.coralogix.com': 'api.coralogix.us',
  'us2.coralogix.com': 'api.cx498.coralogix.com',
  'ap1.coralogix.com': 'api.coralogix.in',
  'ap2.coralogix.com': 'api.coralogixsg.com',
  'ap3.coralogix.com': 'api.ap3.coralogix.com',
};

export async function makeRequest(
  auth: AppConnectionValueForAuthProperty<typeof coralogixAuth>,
  apiType: CoralogixApiType,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: QueryParams
) {
  const coralogixDomain = auth.props.coralogixDomain;
  const domain =
    apiType === 'management'
      ? MANAGEMENT_DOMAIN[coralogixDomain] ?? 'api.coralogix.com'
      : `ingress.${coralogixDomain}`;
  const apiKey =
    apiType === 'management'
      ? auth.props.personalOrTeamApiKey
      : auth.props.sendYourDataApiKey;
  const response = await httpClient.sendRequest({
    method,
    url: `https://${domain}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  });

  return response.body;
}
