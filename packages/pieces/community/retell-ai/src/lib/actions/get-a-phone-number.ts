import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { phoneNumberIdDropdown } from '../common/props';

export const getAPhoneNumber = createAction({
  auth: RetllAiAuth,
  name: 'getAPhoneNumber',
  displayName: 'Get a Phone Number',
  description:
    'Retrieve full details for an existing phone number in Retell AI',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/get-phone-number/${propsValue.phoneNumberId}`,
      undefined
    );

    return response;
  },
});
