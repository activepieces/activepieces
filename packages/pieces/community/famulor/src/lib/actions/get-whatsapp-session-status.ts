import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getWhatsAppSessionStatus = createAction({
  auth: famulorAuth,
  name: 'getWhatsAppSessionStatus',
  displayName: 'Get WhatsApp Session Status',
  description: 'Check if a 24-hour WhatsApp messaging session is active for a sender and recipient.',
  audience: 'both',
  aiMetadata: {
    description:
      'Check whether a 24-hour WhatsApp messaging window is currently open between a given sender and recipient. Use before sending a free-text WhatsApp message to decide whether Send WhatsApp Freeform is allowed or a pre-approved template is required. Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.getWhatsAppSessionStatusProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      famulorCommon.getWhatsAppSessionStatusSchema,
    );

    return await famulorCommon.getWhatsAppSessionStatus({
      auth: auth.secret_text,
      sender_id: propsValue.sender_id as number,
      recipient_phone: propsValue.recipient_phone as string,
    });
  },
});
