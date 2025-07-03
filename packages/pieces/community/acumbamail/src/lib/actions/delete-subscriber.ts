import { acumbamailAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { acumbamailCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const removeSubscribeAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_remove_subscriber',
  displayName: 'Remove Subscriber',
  description:
    'Removes a subscriber from a list',
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
      url: acumbamailCommon.baseUrl + '/deleteSubscriber/',
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
