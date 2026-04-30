import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getWhatsAppSessionStatus = createAction({
  auth: famulorAuth,
  name: 'getWhatsAppSessionStatus',
  displayName: 'Get WhatsApp Session Status',
  description: 'Check if a 24-hour WhatsApp messaging session is active for a sender and recipient.',
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
