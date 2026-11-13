import { createAction } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';
import { senderSubscriberWriteOutputSchema } from '../output-schemas';

export const addSubscriberToGroupAction = createAction({
  auth: senderAuth,
  name: 'add_subscriber_to_group',
  outputSchema: senderSubscriberWriteOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Subscriber to Group',
  description: 'Add an existing or new subscriber into one or more groups',
  audience: 'human',
  aiMetadata: { description: 'Assigns a single subscriber to one or more groups/lists in a Sender account, identified by their subscriber ID. Use to segment a contact for targeted campaigns. Idempotent: adding a contact already in a group leaves membership unchanged.', idempotent: true },
  props: {
    subscriber: senderProps.subscriber({ required: true }),
    groups: senderProps.groupIds({ required: false }),
  },
  async run(context) {
    return await senderApi.updateSubscriber({
      auth: context.auth,
      subscriberId: context.propsValue.subscriber,
      groups: context.propsValue.groups,
    });
  },
});
