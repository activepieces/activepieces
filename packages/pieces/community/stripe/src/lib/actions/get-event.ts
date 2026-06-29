import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeGetEvent = createAction({
  name: 'get_event',
  auth: stripeAuth,
  displayName: 'Get Event (Agent)',
  description: 'Retrieve a single Stripe event by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single Stripe event by its ID (e.g., evt_...), including the object snapshot it carried. Use List Events or a webhook payload to obtain the ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The event ID (e.g., evt_...). Obtain it from List Events or a webhook payload.',
      required: true,
    }),
  },
  async run(context) {
    const { event_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/events/${event_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
