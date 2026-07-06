import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const searchAvailablePhoneNumbers = createAction({
  auth: famulorAuth,
  name: 'searchAvailablePhoneNumbers',
  displayName: 'Search Available Phone Numbers',
  description: 'Search for phone numbers available to purchase.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search the catalog of phone numbers available to purchase, filtered by country code and an optional digit/pattern match. Use to find candidate numbers before buying one with Purchase Phone Number. Read-only and idempotent; it browses inventory and does not buy anything.',
    idempotent: true,
  },
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
