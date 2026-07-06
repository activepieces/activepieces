import { acumbamailAuth } from '../auth';
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
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single contact by email across the Acumbamail account and returns their detailed subscriber data for every list they belong to. Use to check whether an address is subscribed and retrieve its per-list membership details before adding, updating, or removing it. Requires the subscriber email. Idempotent: read-only lookup with no side effects.',
    idempotent: true,
  },
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
      queryParams: { auth_token: context.auth.secret_text, subscriber: subscriber },
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
