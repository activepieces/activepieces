import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../../index';
import { bubbleCommon } from '../common';

export const bubbleCreateThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_create_thing',
  displayName: 'Create Thing',
  description: 'Create a thing',
  props: {
    typename: bubbleCommon.typename,
    fields: bubbleCommon.fields,
  },
  async run(context) {
    const { appname, token } = context.auth;
    const { typename, fields } = context.propsValue;

    const server_url = `https://${appname}.bubbleapps.io/api/1.1/obj/${typename}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: server_url,
      headers: {
        'user-agent': 'activepieces',
        Authorization: `Bearer ${token}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: fields,
    });

    return response.body;
  },
});
