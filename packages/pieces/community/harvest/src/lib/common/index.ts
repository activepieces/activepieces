import { DynamicPropsValue } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export async function callHarvestApi<T extends HttpMessageBody = any>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  queryParams: any | undefined = undefined,
  body: any | undefined = undefined,
  headers: any | undefined = undefined
): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method: method,
    url: `https://api.harvestapp.com/v2/${apiUrl}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    headers,
    body,
    queryParams,
  });
}

//Remove null/undefined values and create an array to be used for queryparams
export function filterDynamicFields(dynamicFields: DynamicPropsValue): { [key: string]: string } {
  const fields: { [key: string]: string } = {};

  const props = Object.entries(dynamicFields);
  for (const [propertyKey, propertyValue] of props) {
    if (
      propertyValue !== null &&
      propertyValue !== undefined &&
      propertyValue !== '' &&
      !(typeof propertyValue === 'string' && propertyValue.trim() === '')
    ) {
      fields[propertyKey] = propertyValue;
    }
  }

  return fields;
}