import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const listPhoneNumbers = createAction({
  auth: famulorAuth,
  name: 'listPhoneNumbers',
  displayName: 'List Phone Numbers',
  description:
    'Lists all phone numbers linked to your account (E.164, type, SMS capability, subscription status, region). Uses the documented /all endpoint, not the legacy SMS-only list.',
  props: famulorCommon.listAccountPhoneNumbersProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      famulorCommon.listAccountPhoneNumbersSchema,
    );

    return await famulorCommon.listAccountPhoneNumbers({
      auth: auth.secret_text,
    });
  },
});
