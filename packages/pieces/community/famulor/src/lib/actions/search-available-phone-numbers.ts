import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const searchAvailablePhoneNumbers = createAction({
  auth: famulorAuth,
  name: 'searchAvailablePhoneNumbers',
  displayName: 'Search Available Phone Numbers',
  description:
    'Search numbers available for purchase from Famulor’s provider (price, SMS, address requirements). Use the result with Purchase Phone Number when you add that action.',
  props: famulorCommon.searchAvailablePhoneNumbersProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      famulorCommon.searchAvailablePhoneNumbersSchema,
    );

    const countryCode = propsValue.country_code as string;
    const containsRaw = propsValue.contains as string | undefined;
    const trimmed = containsRaw?.trim();

    return await famulorCommon.searchAvailablePhoneNumbers({
      auth: auth.secret_text,
      country_code: countryCode,
      contains: trimmed || undefined,
    });
  },
});
