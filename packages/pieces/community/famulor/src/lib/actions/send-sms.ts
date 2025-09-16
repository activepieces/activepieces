import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const sendSms = createAction({
  auth: famulorAuth,
  name: 'sendSms',
  displayName: 'Send SMS',
  description: 'Send an SMS message using your purchased phone numbers. Costs are automatically deducted from your account.',
  props: famulorCommon.sendSmsProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.sendSmsSchema);

    return await famulorCommon.sendSms({
      auth: auth as string,
      from: propsValue.from as number,
      to: propsValue.to!,
      bodysuit: propsValue.bodysuit!,
    });
  },
});
