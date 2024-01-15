import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../../index';
import { bubbleCommon } from '../common';

export const bubbleGetThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_get_thing',
  displayName: 'Get Thing',
  description: 'Get a thing by id',
  props: {
    typename: bubbleCommon.typename,
    thing_id: bubbleCommon.thing_id,
  },
  async run(context) {
    const { appname, token } = context.auth;
    const { typename, thing_id } = context.propsValue;

    const server_url = `https://${appname}.bubbleapps.io/api/1.1/obj/${typename}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: server_url,
      headers: {
        'user-agent': 'activepieces',
        Authorization: `Bearer ${token}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        constraint: `id = ${thing_id}`,
      },
    });

    return response.body;
  },
});
