import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendDocument = createAction({
  auth: kapsoAuth,
  name: 'send_document',
  displayName: 'Send Document',
  description: 'Send a document message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    documentUrl: Property.ShortText({
      displayName: 'Document URL',
      description: 'Public URL of the document to send.',
      required: false,
    }),
    documentId: Property.ShortText({
      displayName: 'Document Media ID',
      description: 'Media ID of a previously uploaded document. Use either URL or Media ID.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The filename to display for the document.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption for the document.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, documentUrl, documentId, filename, caption } =
      context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendDocument({
      phoneNumberId,
      to,
      document: {
        link: documentUrl ?? undefined,
        id: documentId ?? undefined,
        filename: filename ?? undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
