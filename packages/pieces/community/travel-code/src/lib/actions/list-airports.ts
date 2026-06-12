import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { travelCodeAuth } from '../../index';
import { travelCodeCommon } from '../common';

export const listAirports = createAction({
  auth: travelCodeAuth,
  name: 'list_airports',
  displayName: 'List Airports',
  description: 'Retrieve the list of airports with IATA code, city, and country.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Travel Code airports reference list (IATA code, city, country). Read-only and idempotent; use it to resolve airport codes before searching for flights.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${travelCodeCommon.baseUrl}/data/airports`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
