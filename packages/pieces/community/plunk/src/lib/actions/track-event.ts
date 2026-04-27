import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { plunkAuth, PLUNK_BASE_URL } from '../../index';

export const trackEvent = createAction({
  auth: plunkAuth,
  name: 'track_event',
  displayName: 'Track Event',
  description:
    'Track a Plunk event for a contact. Plunk auto-creates the contact if they do not exist. Requires the public API key.',
  props: {
    event: Property.ShortText({
      displayName: 'Event Name',
      description: 'Identifier of the event being tracked, e.g. `order.completed`.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact the event belongs to.',
      required: true,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Mark Contact as Subscribed',
      description:
        'When enabled, contacts auto-created by this event will be marked as subscribed.',
      required: false,
    }),
    data: Property.Object({
      displayName: 'Event Data',
      description: 'Optional metadata stored alongside the event.',
      required: false,
    }),
  },
  async run(context) {
    const publicKey = context.auth.props.publicKey;
    if (!publicKey || publicKey.trim().length === 0) {
      throw new Error(
        'Track Event requires a Plunk public API key. Add the public key in the piece authentication.',
      );
    }

    const { event, email, subscribed, data } = context.propsValue;
    const requestBody: Record<string, unknown> = {
      event,
      email,
    };
    if (subscribed === true) requestBody['subscribed'] = true;
    if (data && Object.keys(data).length > 0) requestBody['data'] = data;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${PLUNK_BASE_URL}/track`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: publicKey,
      },
    });
    return response.body;
  },
});
