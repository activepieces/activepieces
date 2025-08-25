import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const createPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'createPhoneNumber',
  displayName: 'Create a Phone Number',
  description: 'Buys a new phone number and binds agents.',
  props: retellCommon.newPhoneNumberProperties,
  async run({ auth: apiKey, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      retellCommon.newPhoneNumberSchema
    );

    // Manually validate the country code and numberProvider to avoid type errors
    const countryCode =
      propsValue.countryCode === 'US' || propsValue.countryCode === 'CA'
        ? propsValue.countryCode
        : undefined;
    const numberProvider =
      propsValue.numberProvider === 'twilio' ||
      propsValue.numberProvider === 'telnyx'
        ? propsValue.numberProvider
        : undefined;

    return retellCommon.createPhoneNumber({
      apiKey,
      ...propsValue,
      countryCode,
      numberProvider,
    });
  },
});
