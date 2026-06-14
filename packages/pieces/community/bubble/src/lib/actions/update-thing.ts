import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../auth';
import { bubbleCommon } from '../common';

export const bubbleUpdateThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_update_thing',
  displayName: 'Update Thing',
  description: 'Updates a thing',
  audience: 'both',
  aiMetadata: { description: 'Update an existing record ("thing") in a Bubble app, identified by its unique id and data type, by patching the supplied fields via the Bubble Data API. Use to modify specific fields of a known record; only the provided fields are changed. Targets one record so repeats with the same input converge, but it mutates server state on each call.', idempotent: false },
  props: {
    typename: bubbleCommon.typename,
    thing_id: bubbleCommon.thing_id,
    fields: bubbleCommon.fields,
  },
  async run(context) {
    const { appname, token } = context.auth.props;
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
