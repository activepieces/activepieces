import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retellAiAuth } from '../..';
import { retellAiCommon } from '../common';

export const getPhoneNumberAction = createAction({
  auth: retellAiAuth,
  name: 'get_phone_number',
  displayName: 'Get a Phone Number',
  description: 'Retrieve full details for an existing phone number in Retell AI.',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to retrieve in E.164 format (e.g., +14157774444).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { phone_number } = propsValue;

    // URL encode the phone number to handle the '+' sign correctly
    const encodedPhoneNumber = encodeURIComponent(phone_number);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${retellAiCommon.baseUrl}/get-phone-number/${encodedPhoneNumber}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});
