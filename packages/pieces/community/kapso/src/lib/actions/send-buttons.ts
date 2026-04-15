import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendButtons = createAction({
  auth: kapsoAuth,
  name: 'send_buttons',
  displayName: 'Send Button Message',
  description: 'Send an interactive button message via WhatsApp (up to 3 buttons).',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    bodyText: Property.LongText({
      displayName: 'Body Text',
      description: 'The message body displayed above the buttons.',
      required: true,
    }),
    buttons: Property.Array({
      displayName: 'Buttons',
      description:
        'Up to 3 buttons. Each button needs an ID and a title (max 20 characters).',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'Button ID',
          description: 'A unique identifier for this button (returned when the user taps it).',
          required: true,
        }),
        title: Property.ShortText({
          displayName: 'Button Title',
          description: 'The text displayed on the button (max 20 characters).',
          required: true,
        }),
      },
    }),
    footerText: Property.ShortText({
      displayName: 'Footer Text',
      description: 'Optional footer text displayed below the buttons.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, bodyText, buttons, footerText } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendInteractiveButtons({
      phoneNumberId,
      to,
      bodyText,
      buttons: (buttons as { id: string; title: string }[]).map((b) => ({
        id: b.id,
        title: b.title,
      })),
      footerText: footerText ?? undefined,
    });

    return response;
  },
});
