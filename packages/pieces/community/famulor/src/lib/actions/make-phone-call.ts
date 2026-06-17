import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const makePhoneCall = createAction({
  auth: famulorAuth,
  name: 'makePhoneCall',
  displayName: 'Make Phone Call',
  description: 'Initiate an AI-powered phone call to a customer.',
  audience: 'both',
  aiMetadata: {
    description:
      'Place a single outbound AI-assistant phone call to one customer number, using the chosen assistant and optional template variables. Use for one-off calls; for bulk outbound calling use a campaign (Start/Stop Campaign) instead. Each invocation dials a new call, so it is not idempotent.',
    idempotent: false,
  },
  props: famulorCommon.makePhoneCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.makePhoneCallSchema);

    return await famulorCommon.makePhoneCall({
      auth: auth.secret_text,
      assistant_id: propsValue.assistant_id as number,
      phone_number: propsValue.phone_number!,
      variable: propsValue.variable,
    });
  },
});
