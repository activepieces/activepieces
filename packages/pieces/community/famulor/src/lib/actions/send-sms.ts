import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendSms = createAction({
  auth: famulorAuth,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: 'Send an SMS message using one of your purchased phone numbers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a single SMS text message from one of the account\'s purchased numbers to a recipient. Use for plain SMS delivery; for WhatsApp use the WhatsApp send actions instead. Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  props: famulorCommon.sendSmsProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.sendSmsSchema);

    return await famulorCommon.sendSms({
      auth: auth.secret_text,
      from: propsValue.from as number,
      to: propsValue.to!,
      bodysuit: propsValue.bodysuit!,
    });
  },
});
