import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retentionStackAuth } from '../..';
import { apiRequest, commonProps } from '../common';

export const sendFile = createAction({
  name: 'sendFile',
  auth: retentionStackAuth,
  displayName: 'Send File',
  description: 'Sends a document (PDF, spreadsheet, etc.) from a public URL.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a document, fetched from a public URL, from the linked WhatsApp number to one phone number or group. Not idempotent: each call sends a new message.',
    idempotent: false,
  },
  props: {
    ...commonProps,
    fileUrl: Property.ShortText({ displayName: 'File URL', description: 'Public URL of the file.', required: true }),
    filename: Property.ShortText({ displayName: 'File Name', description: 'Name shown to the recipient, e.g. invoice.pdf.', required: false }),
    caption: Property.LongText({ displayName: 'Caption', required: false }),
  },
  async run(ctx) {
    const { session, chatId, fileUrl, filename, caption } = ctx.propsValue;
    return await apiRequest(ctx.auth.secret_text, HttpMethod.POST, '/v1/sendFile', {
      session,
      chatId,
      file: { url: fileUrl, filename },
      caption,
    });
  },
});
