import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const getPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'getPhoneNumber',
  displayName: 'Get a Phone Number',
  description:
    'Retrieve full details for an existing phone number in Retell AI.',
  props: retellCommon.getPhoneNumberProperties(),
  async run({ auth: apiKey, propsValue: { phoneNumber } }) {
    await propsValidation.validateZod(
      { phoneNumber },
      retellCommon.getPhoneNumberSchema
    );
    return retellCommon.getPhoneNumber({ apiKey, phoneNumber });
  },
});
