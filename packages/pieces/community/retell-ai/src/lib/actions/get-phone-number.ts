import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi, retellAiCommon } from '../common';

export const getPhoneNumber = createAction({
  auth: retellAiAuth,
  name: 'get_phone_number',
  displayName: 'Get a Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI',
  props: {
    phone_number: retellAiCommon.phone_number,
  },
  async run(context) {
    const { phone_number } = context.propsValue;

    const response = await retellAiApi.get(`/v2/get-phone-number`, context.auth, { phone_number });
    return response;
  },
});
