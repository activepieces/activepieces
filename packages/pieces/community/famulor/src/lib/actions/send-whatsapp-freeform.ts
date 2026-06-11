import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendWhatsAppFreeform = createAction({
  auth: famulorAuth,
  name: 'sendWhatsAppFreeform',
  displayName: 'Send WhatsApp Freeform Message',
  description: 'Send a free-text WhatsApp message within an active 24-hour session.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a free-text (non-template) WhatsApp message from a sender to a recipient. This only works while a 24-hour customer-initiated session is open; outside that window a pre-approved template is required instead (see Get WhatsApp Templates). Check the window first with Get WhatsApp Session Status. Each call sends a new message, so it is not idempotent.',
    idempotent: false,
  },
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
