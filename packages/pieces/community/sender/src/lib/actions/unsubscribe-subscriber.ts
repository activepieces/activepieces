import { createAction } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';
import { senderDeleteSubscribersOutputSchema } from '../output-schemas';

export const unsubscribeSubscriberAction = createAction({
  auth: senderAuth,
  name: 'unsubscribe_subscriber',
  outputSchema: senderDeleteSubscribersOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Subscriber',
  description: 'Mark an email address as unsubscribed globally or from a group',
  audience: 'human',
  aiMetadata: { description: 'Marks a subscriber as unsubscribed in a Sender account so they stop receiving campaigns. Use to honor an opt-out or suppress a contact. Identify the subscriber by their Sender subscriber ID. Idempotent: re-running on an already-unsubscribed contact leaves them unsubscribed with no further effect.', idempotent: true },
  props: {
    subscriber: senderProps.subscriber({ required: true }),
  },
  async run(context) {
    return await senderApi.deleteSubscribers({
      auth: context.auth,
      subscribers: [context.propsValue.subscriber],
    });
  },
});
