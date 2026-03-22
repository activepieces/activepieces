import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getWhatsAppSessionStatus = createAction({
  auth: famulorAuth,
  name: 'getWhatsAppSessionStatus',
  displayName: 'Get WhatsApp Session Status',
  description:
    'Check the 24-hour messaging window for a sender and recipient. Use `session_status.can_send_freeform` to choose freeform vs template messages. Does not consume balance.',
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
