import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendWhatsAppFreeform = createAction({
  auth: famulorAuth,
  name: 'sendWhatsAppFreeform',
  displayName: 'Send WhatsApp Freeform Message',
  description:
    'Send free-text WhatsApp within an active 24-hour session (after the user messaged you). If the window expired, use Send WhatsApp Template Message first. Rate limit: 5 requests per second.',
  props: famulorCommon.sendWhatsAppFreeformProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.sendWhatsAppFreeformSchema);

    return await famulorCommon.sendWhatsAppFreeform({
      auth: auth.secret_text,
      sender_id: propsValue.sender_id as number,
      recipient_phone: propsValue.recipient_phone as string,
      message: propsValue.message as string,
    });
  },
});
