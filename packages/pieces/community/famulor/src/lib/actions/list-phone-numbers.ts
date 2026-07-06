import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const listPhoneNumbers = createAction({
  auth: famulorAuth,
  name: 'listPhoneNumbers',
  displayName: 'List Phone Numbers',
  description: 'List all phone numbers linked to your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the phone numbers already owned by / linked to the account. Use to discover which numbers are available to send from or assign; to find new numbers to buy use Search Available Phone Numbers instead. Read-only and idempotent.',
    idempotent: true,
  },
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
