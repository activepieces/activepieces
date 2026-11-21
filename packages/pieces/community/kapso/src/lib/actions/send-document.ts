import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendDocument = createAction({
  auth: kapsoAuth,
  name: 'send_document',
  classification: 'WRITE',
  displayName: 'Send Document',
  description: 'Send a document message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a document (e.g. PDF) to a WhatsApp recipient, optionally with a display filename and caption. Supply the document either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
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
      key: 'media',
      display: 'section',
      label: 'Document',
      icon: 'paperclip',
      props: ['documentUrl', 'documentId', 'filename', 'caption'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    documentUrl: Property.ShortText({
      displayName: 'Document URL',
      description: 'A public link to the document. Leave empty to use a Media ID.',
      placeholder: 'https://example.com/invoice.pdf',
      required: false,
    }),
    documentId: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of a file already uploaded to WhatsApp. Use instead of the URL.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'The name the recipient sees.',
      placeholder: 'invoice.pdf',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Text shown under the document.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, documentUrl, documentId, filename, caption } =
      context.propsValue;
    if (!documentUrl && !documentId) {
      throw new Error('Enter a Document URL or a Media ID.');
    }
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendDocument({
      phoneNumberId,
      to,
      document: {
        link: documentUrl || undefined,
        id: documentId || undefined,
        filename: filename ?? undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
