import { acumbamailAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { acumbamailCommon } from '../common';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const searchSubscriberAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_search_subscriber',
  displayName: 'Search Subscriber',
  description:
    "Returns the subscriber's advanced data in each list to which they belong.",
  props: {
    subscriber: Property.ShortText({
      displayName: 'Subscriber Email',
      required: true,
    }),
  },
  async run(context) {
    const { subscriber } = context.propsValue;
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: acumbamailCommon.baseUrl + '/searchSubscriber/',
      queryParams: { auth_token: context.auth, subscriber: subscriber },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
