import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const makePhoneCall = createAction({
  auth: famulorAuth,
  name: 'makePhoneCall',
  displayName: 'Make Phone Call',
  description: 'Initiate an AI-powered phone call to a customer using a selected assistant.',
  props: famulorCommon.makePhoneCallProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.makePhoneCallSchema);

    return await famulorCommon.makePhoneCall({
      auth: auth as string,
      assistant_id: propsValue.assistant_id as number,
      phone_number: propsValue.phone_number!,
      variable: propsValue.variable,
    });
  },
});
