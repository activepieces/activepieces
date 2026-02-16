import {
  HttpMethod,
  HttpRequest,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';

export const KLAVIYO_API_BASE_URL = 'https://a.klaviyo.com/api';
export const KLAVIYO_API_REVISION = '2024-10-15';

export async function klaviyoApiRequest(
  auth: PiecePropValueSchema<typeof klaviyoAuth>,
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<any> {
  const request: HttpRequest = {
    method,
    url: `${KLAVIYO_API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Klaviyo-API-Key ${auth}`,
      'revision': KLAVIYO_API_REVISION,
      'Content-Type': 'application/json',
    },
    body: body ? body : undefined,
    queryParams,
  };

  const response = await httpClient.sendRequest(request);
  return response.body;
}

export interface KlaviyoProfile {
  type: 'profile';
  id?: string;
  attributes: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    title?: string;
    image?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
      timezone?: string;
    };
    properties?: Record<string, any>;
  };
}

export interface KlaviyoList {
  type: 'list';
  id?: string;
  attributes: {
    name: string;
  };
}

export interface KlaviyoTag {
  type: 'tag';
  id?: string;
  attributes: {
    name: string;
  };
}
