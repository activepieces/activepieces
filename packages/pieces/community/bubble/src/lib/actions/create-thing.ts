import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../auth';
import { bubbleCommon } from '../common';

export const bubbleCreateThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_create_thing',
  displayName: 'Create Thing',
  description: 'Create a thing',
  audience: 'both',
  aiMetadata: { description: 'Create a new record ("thing") of a given data type in a Bubble app via the Bubble Data API. Use to add a new entry; supply the type name and a fields object with the values to set. Not idempotent — each call creates a separate record.', idempotent: false },
  props: {
    typename: bubbleCommon.typename,
    fields: bubbleCommon.fields,
  },
  async run(context) {
    const { appname, token } = context.auth.props;
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
