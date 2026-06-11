import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { businessAccountIdProp, phoneNumberIdDropdown } from '../common/props';

export const sendReaction = createAction({
  auth: kapsoAuth,
  name: 'send_reaction',
  displayName: 'Send Reaction',
  description: 'React to a WhatsApp message with an emoji.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds an emoji reaction to a specific WhatsApp message identified by its message ID; passing an empty emoji removes the existing reaction. Use to acknowledge or respond to a message without sending a full reply. Requires the target message ID. Mutates the message reaction state on each call, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to react to.',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'The emoji to react with (e.g. 👍). Leave empty to remove a reaction.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, messageId, emoji } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendReaction({
      phoneNumberId,
      to,
      reaction: {
        messageId,
        emoji: emoji ?? undefined,
      },
    });

    return response;
  },
});
