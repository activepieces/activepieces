import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

export const upsertContact = createAction({
  auth: insightoAiAuth,
  name: 'upsert_contact',
  displayName: 'Upsert Contact',
  description:
    'Creates a new contact or updates an existing one based on email or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact. Used for matching.',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name.",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name.",
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number of the contact, including country code (e.g., 16501111234).',
      required: false,
    }),
  },
  async run(context) {
    const { email, first_name, last_name, phone_number } = context.propsValue;

    const queryParams: Record<string, string> = {
      email: email,
    };
    if (first_name) {
      queryParams['first_name'] = first_name;
    }
    if (last_name) {
      queryParams['last_name'] = last_name;
    }
    if (phone_number) {
      queryParams['phone_number'] = phone_number;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.insighto.ai/v1/contact/upsert',
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      queryParams: queryParams,
    });
  },
});
