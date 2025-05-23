import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { zohoDeskAuth } from '../..';
import { zohoDeskCommon } from '../common';

export const listTicketsAction = createAction({
  auth: zohoDeskAuth,
  name: 'list_tickets',
  description: 'List tickets',
  displayName: 'List tickets',
  props: {
    orgId: Property.ShortText({
      displayName: 'orgId',
      required: true,
      description:
        'ID of the organization to access. All API endpoints except /organizations mandatorily require the orgId.',
    }),
    include: Property.Array({
      displayName: 'include',
      required: false,
      description: 'Additional information related to the tickets. Values allowed are: contacts, products, departments, team, isRead and assignee. You can pass multiple values'
    })
  },
  async run({ propsValue, auth }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.include) queryParams['include'] = propsValue.include.join(',');

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${zohoDeskCommon.baseUrl}/tickets`,
      queryParams,
      headers: zohoDeskCommon.authHeaders(auth.access_token, propsValue.orgId),
    };

    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
