import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retentionStackAuth } from '../..';
import { apiRequest, commonProps } from '../common';

export const sendText = createAction({
  name: 'sendText',
  auth: retentionStackAuth,
  displayName: 'Send Text Message',
  description: 'Sends a text message to a contact or group.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a WhatsApp text message from the linked number to one phone number or group. Not idempotent: each call sends a new message.',
    idempotent: false,
  },
  props: {
    ...commonProps,
    text: Property.LongText({ displayName: 'Message', required: true }),
  },
  async run(ctx) {
    const { session, chatId, text } = ctx.propsValue;
    return await apiRequest(ctx.auth.secret_text, HttpMethod.POST, '/v1/sendText', {
      session,
      chatId,
      text,
    });
  },
});
