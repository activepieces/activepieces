import { acumbamailAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { acumbamailCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const deleteSubscriberAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_delete_subscriber',
  displayName: 'Delete Subscriber',
  description:
    'Unsubscribes an email address from a subscriber list of your choosing.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    listId: acumbamailCommon.listId,
  },
  async run(context) {
    const { listId, email } = context.propsValue;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: acumbamailCommon.baseUrl + '/unsubscribeSubscriber/',
      queryParams: {
        auth_token: context.auth,
        list_id: listId.toString(),
        email: email,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
