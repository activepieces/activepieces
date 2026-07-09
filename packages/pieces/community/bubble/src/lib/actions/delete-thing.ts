import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../auth';
import { bubbleCommon } from '../common';

export const bubbleDeleteThingAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_delete_thing',
  displayName: 'Delete Thing',
  description: 'Delete a thing',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a single record ("thing") from a Bubble app by its unique id and data type, via the Bubble Data API. Use when an agent must remove a specific record it already knows the id of. Effectively idempotent (deleting an already-deleted id is a no-op) but destructive — verify the id before calling.', idempotent: true },
  props: {
    typename: bubbleCommon.typename,
    thing_id: bubbleCommon.thing_id,
  },
  async run(context) {
    const { appname, token } = context.auth.props;
    const { typename, thing_id } = context.propsValue;

    const server_url = `https://${appname}.bubbleapps.io/api/1.1/obj/${typename}/${thing_id}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: server_url,
      headers: {
        'user-agent': 'activepieces',
        Authorization: `Bearer ${token}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    });

    return response.body;
  },
});
