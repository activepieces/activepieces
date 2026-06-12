import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { travelCodeAuth } from '../../index';
import { travelCodeCommon } from '../common';

export const listAirlines = createAction({
  auth: travelCodeAuth,
  name: 'list_airlines',
  displayName: 'List Airlines',
  description: 'Retrieve the list of airlines with IATA code and name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Travel Code airlines reference list (IATA code, name). Read-only and idempotent; use it to resolve airline codes.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${travelCodeCommon.baseUrl}/data/airlines`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
