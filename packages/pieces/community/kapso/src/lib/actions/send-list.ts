import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendList = createAction({
  auth: kapsoAuth,
  name: 'send_list_message',
  classification: 'WRITE',
  displayName: 'Send List Message',
  description: 'Send an interactive list message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an interactive WhatsApp list message: a tap-to-open button reveals selectable rows grouped into sections. Use when the recipient must choose from more options than fit in reply buttons (the 3-button limit). Each row needs an id and title; rows are passed as a JSON array per section. Each call delivers a new message, so it is not idempotent.',
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
      props: ['bodyText', 'buttonText', 'sections'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    bodyText: Property.LongText({
      displayName: 'Message',
      description: 'Shown above the list button.',
      required: true,
    }),
    buttonText: Property.ShortText({
      displayName: 'Button Text',
      description: 'Opens the list. Up to 20 characters.',
      placeholder: 'View options',
      required: true,
    }),
    sections: Property.Array({
      displayName: 'Sections',
      description: 'Groups of rows the person can pick from.',
      required: true,
      properties: {
        title: Property.ShortText({
          displayName: 'Section Title',
          description: 'Required when the list has more than one section.',
          required: false,
        }),
        rows: Property.Json({
          displayName: 'Rows',
          description:
            'JSON array of rows, each with an id, a title and an optional description.',
          required: true,
        }),
      },
    }),
    headerText: Property.ShortText({
      displayName: 'Header',
      description: 'Bold text above the message.',
      required: false,
      advanced: true,
    }),
    footerText: Property.ShortText({
      displayName: 'Footer',
      description: 'Small grey text under the message.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, bodyText, buttonText, sections, headerText, footerText } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const parsedSections = (
      sections as { title?: string; rows: unknown }[]
    ).map((s) => ({
      title: s.title,
      rows: (typeof s.rows === 'string' ? JSON.parse(s.rows) : s.rows) as {
        id: string;
        title: string;
        description?: string;
      }[],
    }));

    const response = await client.messages.sendInteractiveList({
      phoneNumberId,
      to,
      bodyText,
      buttonText,
      sections: parsedSections,
      header: headerText ? { type: 'text' as const, text: headerText } : undefined,
      footerText: footerText ?? undefined,
    });

    return response;
  },
});
