import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendWhatsAppTemplate = createAction({
  auth: famulorAuth,
  name: 'sendWhatsAppTemplate',
  displayName: 'Send WhatsApp Template Message',
  description: 'Send an approved WhatsApp template message via a Famulor sender.',
  props: famulorCommon.sendWhatsAppTemplateProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.sendWhatsAppTemplateSchema);

    const vars = propsValue.variables as Record<string, string> | undefined;
    const recipientName = propsValue.recipient_name as string | undefined;

    return await famulorCommon.sendWhatsAppTemplate({
      auth: auth.secret_text,
      sender_id: propsValue.sender_id as number,
      template_id: propsValue.template_id as number,
      recipient_phone: propsValue.recipient_phone as string,
      recipient_name: recipientName?.trim() ? recipientName.trim() : undefined,
      variables:
        vars !== undefined && Object.keys(vars).length > 0 ? vars : undefined,
    });
  },
});
