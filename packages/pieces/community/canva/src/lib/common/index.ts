import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

export const CANVA_API_BASE_URL = 'https://api.canva.com/rest/v1';

export const canvaCommon = {
  designId: Property.ShortText({
    displayName: 'Design ID',
    description: 'The unique identifier for the Canva design.',
    required: true,
  }),
  folderId: Property.ShortText({
    displayName: 'Folder ID',
    description: 'The unique identifier for the Canva folder. Use "root" for the root folder.',
    required: true,
  }),
  assetId: Property.ShortText({
    displayName: 'Asset ID',
    description: 'The unique identifier for the Canva asset.',
    required: true,
  }),
};

export async function canvaApiRequest<T = Record<string, unknown>>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${CANVA_API_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams,
    body: body as Record<string, unknown> | undefined,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
