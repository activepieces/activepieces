import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { coralogixAuth } from './auth';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

type CoralogixApiType = 'management' | 'ingestion' | 'dataQuery';

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
      ? `api.${coralogixDomain}`
      : apiType === 'ingestion'
      ? `ingress.${coralogixDomain}`
      : `api.${coralogixDomain}`;
  const apiKey =
    apiType === 'management' || apiType === 'dataQuery'
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
