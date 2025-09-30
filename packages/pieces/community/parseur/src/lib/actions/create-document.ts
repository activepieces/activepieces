import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';

export const createDocument = createAction({
  auth: parseurAuth,
  name: 'createDocument',
  displayName: 'Create Document',
  description: 'Creates a new document.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the document/email.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'The sender email address.',
      required: true,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'The recipient email address.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The "To" email address.',
      required: false,
    }),
    cc: Property.ShortText({
      displayName: 'CC',
      description: 'The "CC" email address.',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC',
      description: 'The "BCC" email address.',
      required: false,
    }),
    body_html: Property.LongText({
      displayName: 'Body HTML',
      description: 'The HTML content of the document/email.',
      required: false,
    }),
    body_plain: Property.LongText({
      displayName: 'Body Plain',
      description: 'The plain text content of the document/email.',
      required: false,
    }),
    message_headers: Property.Object({
      displayName: 'Message Headers',
      description:
        'A JSON object representing the email headers (key-value pairs).',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { message_headers, ...rest } = propsValue;
    return await parseurCommon.createDocument({
      apiKey,
      ...rest,
      message_headers: message_headers
        ? Object.fromEntries(
            Object.entries(message_headers).map(([k, v]) => [k, String(v)])
          )
        : undefined,
    });
  },
});
