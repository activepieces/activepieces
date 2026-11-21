import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendButtons = createAction({
  auth: kapsoAuth,
  name: 'send_buttons',
  classification: 'WRITE',
  displayName: 'Send Button Message',
  description: 'Send an interactive button message via WhatsApp (up to 3 buttons).',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an interactive WhatsApp message with up to 3 reply buttons, each carrying an ID returned when the user taps it. Use when you want the recipient to pick from a small set of quick-reply options rather than typing. Button titles are capped at 20 characters. Each call delivers a new message, so it is not idempotent.',
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
      props: ['windowInfo', 'to'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['bodyText', 'buttons'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    bodyText: Property.LongText({
      displayName: 'Message',
      description: 'Shown above the buttons.',
      required: true,
    }),
    buttons: Property.Array({
      displayName: 'Buttons',
      description: 'Up to 3 buttons.',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'Button ID',
          description: 'Sent back to you when the person taps this button.',
          placeholder: 'confirm',
          required: true,
        }),
        title: Property.ShortText({
          displayName: 'Button Title',
          description: 'Up to 20 characters.',
          placeholder: 'Confirm',
          required: true,
        }),
      },
    }),
    footerText: Property.ShortText({
      displayName: 'Footer',
      description: 'Small grey text under the message.',
      required: false,
      advanced: true,
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
