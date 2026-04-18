import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DropcontactAuthType } from './auth';

const BASE_URL = 'https://api.dropcontact.io';

async function makeRequest({
  auth,
  method = HttpMethod.GET,
  path,
  body,
}: {
  auth: DropcontactAuthType;
  method?: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}) {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': auth.apiKey,
    },
    body,
  });

  if (response.status >= 400) {
    throw new Error(
      `Dropcontact API error: ${response.status} ${JSON.stringify(response.body)}`
    );
  }

  return response.body;
}

export async function enrichContact({
  auth,
  contact,
  siren,
  language,
}: {
  auth: DropcontactAuthType;
  contact: Record<string, unknown>;
  siren?: boolean;
  language?: string;
}) {
  const body: Record<string, unknown> = {
    data: [contact],
  };
  if (siren !== undefined) body['siren'] = siren;
  if (language) body['language'] = language;

  return makeRequest({
    auth,
    method: HttpMethod.POST,
    path: '/batch',
    body,
  });
}

export async function getEnrichmentRequest({
  auth,
  requestId,
}: {
  auth: DropcontactAuthType;
  requestId: string;
}) {
  return makeRequest({
    auth,
    path: `/batch/${requestId}`,
  });
}
