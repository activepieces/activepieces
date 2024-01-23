import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../../index';
import { bubbleCommon } from '../common';

export const bubbleUpdateThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_update_thing',
  displayName: 'Update Thing',
  description: 'Updates a thing',
  props: {
    typename: bubbleCommon.typename,
    thing_id: bubbleCommon.thing_id,
    fields: bubbleCommon.fields,
  },
  async run(context) {
    const { appname, token } = context.auth;
    const { typename, thing_id } = context.propsValue;

    const server_url = `https://${appname}.bubbleapps.io/api/1.1/obj/${typename}/${thing_id}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: server_url,
      headers: {
        'user-agent': 'activepieces',
        Authorization: `Bearer ${token}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: context.propsValue.fields,
    });

    return response.body;
  },
});
