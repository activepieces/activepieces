import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { acumbamailAuth } from '../../';
import { acumbamailCommon } from '../common';

export const deleteSubscriberListAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_delete_subscriber_list',
  displayName: 'Delete Subscriber List',
  description: 'Deletes an existing subscriber list.',
  props: {
    listId: acumbamailCommon.listId,
  },
  async run(context) {
    const { listId } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: acumbamailCommon.baseUrl + '/deleteList/',
      queryParams: { auth_token: context.auth, list_id: listId.toString() },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
