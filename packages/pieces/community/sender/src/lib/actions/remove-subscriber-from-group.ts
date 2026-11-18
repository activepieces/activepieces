import { createAction } from '@activepieces/pieces-framework';
import { senderAuth } from '../auth';
import { senderApi } from '../common/api';
import { senderProps } from '../common/props';
import { senderRemoveSubscriberFromGroupOutputSchema } from '../output-schemas';

export const removeSubscriberFromGroupAction = createAction({
  auth: senderAuth,
  name: 'remove_subscriber_from_group',
  outputSchema: senderRemoveSubscriberFromGroupOutputSchema,
  classification: 'WRITE',
  displayName: 'Remove Subscriber from Group',
  description: 'Remove a subscriber from a specific group',
  audience: 'human',
  aiMetadata: { description: 'Removes one or more subscribers from a specific group/list in a Sender account, identified by group ID and subscriber IDs. Use to unsegment contacts without unsubscribing them globally. Idempotent: removing contacts no longer in the group leaves the group unchanged.', idempotent: true },
  props: {
    subscribers: senderProps.subscribers({ required: true }),
    groupId: senderProps.groupId({ required: false }),
  },
  async run(context) {
    const { subscribers, groupId } = context.propsValue;
    const response = await senderApi.removeSubscribersFromGroup({
      auth: context.auth,
      groupId,
      subscribers,
    });
    return {
      success: true,
      subscribers,
      groupId,
      removedAt: new Date().toISOString(),
      response,
    };
  },
});
