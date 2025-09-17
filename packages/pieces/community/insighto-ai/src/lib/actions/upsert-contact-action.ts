import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const upsertContactAction = createAction({
  name: 'upsert_contact',
  displayName: 'Upsert Contact',
  description: 'Create or update a contact using email or phone number',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number including country code (e.g., 16501111234)',
      required: false,
    }),
  },
  async run(context) {
    try {
      const first_name = context.propsValue['first_name'];
      const last_name = context.propsValue['last_name'];
      const email = context.propsValue['email'];
      const phone_number = context.propsValue['phone_number'];

      if (!email && !phone_number) {
        throw new Error('Either email or phone number must be provided');
      }

      const apiKey = context.auth as string;
      const url = `https://api.insighto.ai/api/v1/contact/upsert`;

      const queryParams: Record<string, string> = {
        api_key: apiKey,
      };

      if (first_name) queryParams['first_name'] = first_name;
      if (last_name) queryParams['last_name'] = last_name;
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

      if (!response.body) {
        throw new Error('No response received from Insighto.ai API');
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upsert contact: ${error.message}`);
      }
      throw new Error('Failed to upsert contact');
    }
  },
});
