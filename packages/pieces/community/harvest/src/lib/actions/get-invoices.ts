import {
  createAction,
  Property,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { harvestAuth } from '../..';
import {
  getAccessTokenOrThrow,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const getInvoicesDefault = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getInvoices',
  displayName: 'get invoices',
  description: 'get list of invoices',
  props: {},
  async run() {
    // Action logic here
  },
});


export async function callHarvestApi<T extends HttpMessageBody = any>(
  method: HttpMethod,
  apiUrl: string,
  accessToken: string,
  body: any | undefined = undefined,
  queryParams: any | undefined = undefined,
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


export const getInvoices = createAction({
  name: 'get_invoices', // Must be a unique across the piece, this shouldn't be changed.
  auth: harvestAuth,
  displayName: 'Get Invoices',
  description: 'Fetches invoices',
  props: {},
  async run(context) {
//      const { list_id } = context.propsValue;
      const response = await callHarvestApi(
        HttpMethod.GET,
        `invoices`,
        getAccessTokenOrThrow(context.auth)
      );
  
      return response.body;  },
});

