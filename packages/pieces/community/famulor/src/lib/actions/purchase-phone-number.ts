import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const purchasePhoneNumber = createAction({
  auth: famulorAuth,
  name: 'purchasePhoneNumber',
  displayName: 'Purchase Phone Number',
  description: 'Purchase a phone number from the available search results.',
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
