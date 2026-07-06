import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { businessAccountIdProp, phoneNumberIdDropdown } from '../common/props';

export const markAsRead = createAction({
  auth: kapsoAuth,
  name: 'mark_as_read',
  displayName: 'Mark Message as Read',
  description: 'Mark a WhatsApp message as read.',
  audience: 'both',
  aiMetadata: {
    description: 'Marks a specific incoming WhatsApp message as read (showing blue ticks to the sender), identified by its message ID. Use after processing a received message to update its read receipt. Requires the target message ID. This mutates message state via an API call, so it is treated as not idempotent.',
    idempotent: false,
  },
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to mark as read.',
      required: true,
    }),
  },
  async run(context) {
    const { phoneNumberId, messageId } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.markRead({
      phoneNumberId,
      messageId,
    });

    return response;
  },
});
