import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendReaction = createAction({
  auth: kapsoAuth,
  name: 'send_reaction',
  classification: 'WRITE',
  displayName: 'Send Reaction',
  description: 'React to a WhatsApp message with an emoji.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds an emoji reaction to a specific WhatsApp message identified by its message ID; passing an empty emoji removes the existing reaction. Use to acknowledge or respond to a message without sending a full reply. Requires the target message ID. Mutates the message reaction state on each call, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['to'],
    },
    {
      key: 'reaction',
      display: 'section',
      label: 'Reaction',
      icon: 'reply',
      props: ['messageId', 'emoji'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    to: recipientPhoneProp,
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to react to. It starts with wamid.',
      placeholder: 'wamid.HBgLMTU1NTEyMzQ1NjcVAgASGBQ',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'One emoji. Leave empty to remove your reaction.',
      placeholder: '👍',
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
        emoji: emoji ?? '',
      },
    });

    return response;
  },
});
