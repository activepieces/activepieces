import { createAction, Property } from '@activepieces/pieces-framework';
import { proweblookAuth } from '../auth';
import { proweblookApi } from '../common/client';
import { validatePhoneOutputSchema } from '../common/output-schemas';
import { ValidatePhoneData } from '../common/types';

export const validatePhoneAction = createAction({
  auth: proweblookAuth,
  name: 'validate_phone',
  classification: 'READ',
  audience: 'both',
  displayName: 'Validate Phone Number',
  description:
    'Validate a phone number and inspect carrier, line type, and formatting details.',
  outputSchema: validatePhoneOutputSchema,
  aiMetadata: {
    description:
      'Validates a phone number through ProWebLook and returns its verdict (valid, invalid, or unknown), reason, and carrier/line-type details. Accepts E.164 numbers or national numbers paired with a 2-letter ISO country code.',
    idempotent: true,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in E.164 format (e.g. +12025550123) or national format when Country Code is provided.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Optional 2-letter ISO 3166-1 alpha-2 country code (e.g. US, GB, IN) for national-format numbers. Leave blank when using E.164 (+...).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const phoneNumber = propsValue.phone_number.trim();
    if (!phoneNumber) {
      throw new Error('Phone Number cannot be empty.');
    }

    const rawCountryCode = propsValue.country_code?.trim();
    let countryCode: string | undefined;
    if (rawCountryCode) {
      countryCode = rawCountryCode.toUpperCase();
      if (!/^[A-Z]{2}$/.test(countryCode)) {
        throw new Error(
          'Country Code must be a 2-letter ISO 3166-1 alpha-2 code (e.g. US, GB, IN).'
        );
      }
    }

    return await proweblookApi.post<ValidatePhoneData>({
      apiKey: auth.secret_text.trim(),
      operation: 'validate_phone',
      body: countryCode
        ? { phone_number: phoneNumber, country_code: countryCode }
        : { phone_number: phoneNumber },
    });
  },
});
