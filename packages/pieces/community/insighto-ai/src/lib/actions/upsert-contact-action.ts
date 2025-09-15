import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const upsertContactAction = createAction({
  name: 'upsert_contact',
  displayName: 'Upsert Contact',
  description: 'Upsert a contact using email or phone number',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the contact including the country code. For ex: 16501111234',
      required: false,
    }),
  },
  async run(context) {
    const {
      first_name,
      last_name,
      email,
      phone_number,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const url = `https://api.insighto.ai/api/v1/contact/upsert`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
      first_name,
      last_name,
    };

    // Add email or phone_number if provided
    if (email) queryParams['email'] = email;
    if (phone_number) queryParams['phone_number'] = phone_number;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      queryParams,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
