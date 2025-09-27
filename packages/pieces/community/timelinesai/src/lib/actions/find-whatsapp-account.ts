import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { timelinesaiAuth } from '../common/auth';
import { findWhatsAppAccount as findWhatsAppAccountProps } from '../common/properties';
import { findWhatsAppAccount as findWhatsAppAccountSchema } from '../common/schemas';
import { findWhatsAppAccount as findWhatsAppAccountMethod } from '../common/methods';

export const findWhatsAppAccount = createAction({
  auth: timelinesaiAuth,
  name: 'findWhatsAppAccount',
  displayName: 'Find WhatsApp Account',
  description: 'Search for a WhatsApp account (by phone or ID)',
  props: findWhatsAppAccountProps(),
  async run({ auth, propsValue }) {
    const { api_key } = auth as { api_key: string };
    await propsValidation.validateZod(
      propsValue,
      findWhatsAppAccountSchema
    );

    return await findWhatsAppAccountMethod({
      apiKey: api_key,
      ...propsValue,
    });
  },
});
