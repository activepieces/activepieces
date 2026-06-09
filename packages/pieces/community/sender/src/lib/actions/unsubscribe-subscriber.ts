import { createAction, Property } from '@activepieces/pieces-framework';
import {
  makeSenderRequest,
  senderAuth,
  subscriberDropdownSingle,
} from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { subscribe } from 'diagnostics_channel';

export const unsubscribeSubscriberAction = createAction({
  auth: senderAuth,
  name: 'unsubscribe_subscriber',
  displayName: 'Unsubscribe Subscriber',
  description: 'Mark an email address as unsubscribed globally or from a group',
  audience: 'both',
  aiMetadata: { description: 'Marks a subscriber as unsubscribed in a Sender account so they stop receiving campaigns. Use to honor an opt-out or suppress a contact. Identify the subscriber by their Sender subscriber ID. Idempotent: re-running on an already-unsubscribed contact leaves them unsubscribed with no further effect.', idempotent: true },
  props: {
    subscriber: subscriberDropdownSingle,
  },
  async run(context) {
    const subscriber = context.propsValue.subscriber;
    const subscriberId = subscriber;

    const requestBody = {
      subscribers: [subscriberId],
    };

    const response = await makeSenderRequest(
      context.auth.secret_text,
      `/subscribers`,
      HttpMethod.DELETE,
      requestBody
    );
    return response.body;
  },
});
