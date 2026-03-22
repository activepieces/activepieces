import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getWhatsAppSenders = createAction({
  auth: famulorAuth,
  name: 'getWhatsAppSenders',
  displayName: 'Get WhatsApp Senders',
  description:
    'List WhatsApp Business senders (phone numbers) in your account. Use each sender `id` as `sender_id` when sending WhatsApp messages via the API.',
  props: famulorCommon.getWhatsAppSendersProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getWhatsAppSendersSchema);

    return await famulorCommon.getWhatsAppSenders({
      auth: auth.secret_text,
      status: propsValue.status as 'online' | 'all' | undefined,
    });
  },
});
