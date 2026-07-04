import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getWhatsAppTemplates = createAction({
  auth: famulorAuth,
  name: 'getWhatsAppTemplates',
  displayName: 'Get WhatsApp Templates',
  description: 'List approved WhatsApp message templates for a sender.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the WhatsApp message templates registered to a given sender, defaulting to approved templates with an option to return all statuses. Use to discover which templates can be sent (e.g. to start a conversation outside the 24-hour session window). Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.getWhatsAppTemplatesProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getWhatsAppTemplatesSchema);

    return await famulorCommon.getWhatsAppTemplates({
      auth: auth.secret_text,
      sender_id: propsValue.sender_id as number,
      status: propsValue.status as 'approved' | 'all' | undefined,
    });
  },
});
