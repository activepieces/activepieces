import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { acumbamailAuth } from '../auth';
import { acumbamailCommon } from '../common';

export const deleteSubscriberListAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_delete_subscriber_list',
  displayName: 'Delete Subscriber List',
  description: 'Deletes an existing subscriber list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes an entire Acumbamail subscriber list, identified by its list id, removing the list and its subscriber memberships. Use only when the whole list should be discarded, not to remove an individual contact (use Remove Subscriber for that). Idempotent on the stable list id: once deleted, repeating the call leaves the list absent.',
    idempotent: true,
  },
  props: {
    listId: acumbamailCommon.listId,
  },
  async run(context) {
    const { listId } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: acumbamailCommon.baseUrl + '/deleteList/',
      queryParams: { auth_token: context.auth.secret_text, list_id: listId.toString() },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
