import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendList = createAction({
  auth: kapsoAuth,
  name: 'send_list_message',
  displayName: 'Send List Message',
  description: 'Send an interactive list message via WhatsApp.',
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
      description: 'The message body displayed above the list.',
      required: true,
    }),
    buttonText: Property.ShortText({
      displayName: 'Button Text',
      description: 'The text on the button that opens the list (max 20 characters).',
      required: true,
    }),
    sections: Property.Array({
      displayName: 'Sections',
      description: 'List sections. Each section contains a title and rows.',
      required: true,
      properties: {
        title: Property.ShortText({
          displayName: 'Section Title',
          description: 'Title of this section.',
          required: false,
        }),
        rows: Property.Json({
          displayName: 'Rows',
          description:
            'JSON array of row objects. Each row needs: id, title, and optionally description. Example: [{"id":"row_1","title":"Option 1","description":"First option"}]',
          required: true,
        }),
      },
    }),
    headerText: Property.ShortText({
      displayName: 'Header Text',
      description: 'Optional header text.',
      required: false,
    }),
    footerText: Property.ShortText({
      displayName: 'Footer Text',
      description: 'Optional footer text.',
      required: false,
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
