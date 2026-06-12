import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const purchasePhoneNumber = createAction({
  auth: famulorAuth,
  name: 'purchasePhoneNumber',
  displayName: 'Purchase Phone Number',
  description: 'Purchase a phone number from the available search results.',
  audience: 'both',
  aiMetadata: {
    description:
      'Buy a specific phone number (from Search Available Phone Numbers results) and add it to the account. Use after confirming an available number; this incurs a charge and provisions a real number, so it is not idempotent. To browse purchasable numbers first use Search Available Phone Numbers.',
    idempotent: false,
  },
  props: famulorCommon.purchasePhoneNumberProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      famulorCommon.purchasePhoneNumberSchema,
    );

    return await famulorCommon.purchasePhoneNumber({
      auth: auth.secret_text,
      phone_number: propsValue.phone_number as string,
    });
  },
});
