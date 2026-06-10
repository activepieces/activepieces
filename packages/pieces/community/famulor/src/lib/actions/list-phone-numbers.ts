import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const listPhoneNumbers = createAction({
  auth: famulorAuth,
  name: 'listPhoneNumbers',
  displayName: 'List Phone Numbers',
  description: 'List all phone numbers linked to your account.',
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
