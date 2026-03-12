import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendTextMessage = createAction({
  auth: kapsoAuth,
  name: 'send_text_message',
  displayName: 'Send Text Message',
  description: 'Send a text message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message',
      description: 'The text message to send.',
      required: true,
    }),
    previewUrl: Property.Checkbox({
      displayName: 'Preview URL',
      description: 'Whether to show a link preview if the message contains a URL.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, body, previewUrl } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendText({
      phoneNumberId,
      to,
      body,
      previewUrl: previewUrl ?? undefined,
    });

    return response;
  },
});
