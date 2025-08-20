import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAPhoneNumber = createAction({
  auth: RetllAiAuth,
  name: 'getAPhoneNumber',
  displayName: 'Get a Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI',
  props: {
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'The unique identifier of the phone number to retrieve',
      required: true,
    }),
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