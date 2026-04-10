import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const runPhoneCheckAction = createAction({
  auth: aipriseAuth,
  name: 'run_phone_number_check',
  displayName: 'Check Phone Number for Fraud',
  description:
    'Analyses a phone number for fraud risk — including whether it is a VoIP/virtual number, the carrier it belongs to, and an overall risk score.',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number to check. Must include the country code starting with + (e.g. **+12125551234** for a US number, **+447911123456** for a UK number).',
      required: true,
    }),
  },
  async run(context) {
    const { phone_number } = context.propsValue;
    const result = await aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/run_phone_number_check',
      body: { phone_number },
    });
    return result;
  },
});
