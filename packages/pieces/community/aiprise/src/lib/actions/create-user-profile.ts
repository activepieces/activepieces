import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const createUserProfileAction = createAction({
  auth: aipriseAuth,
  name: 'create_user_profile',
  displayName: 'Create User Profile',
  description:
    'Creates a new user profile in AiPrise. The returned profile can then be used for repeated verifications or ongoing monitoring for the same person.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    middle_name: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    second_last_name: Property.ShortText({
      displayName: 'Second Last Name',
      description: "User's second surname, where applicable (e.g. in some Latin American naming conventions).",
      required: false,
    }),
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The complete name. Use this if you do not have the name split into parts.',
      required: false,
    }),
    date_of_birth: Property.ShortText({
      displayName: 'Date of Birth',
      description: "User's date of birth in YYYY-MM-DD format.",
      required: false,
    }),
    email_address: Property.ShortText({
      displayName: 'Email Address',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    address: Property.Array({
      displayName: 'Address',
      description:
        'Address as a JSON object. Supported fields: `address_street_1`, `address_street_2`, `address_city`, `address_state`, `address_zip_code`, `address_country` (2-letter ISO country code).',
      required: false,
      properties: {
        address_street_1: Property.ShortText({
          displayName: 'Street Address 1',
          required: false,
        }),
        address_street_2: Property.ShortText({
          displayName: 'Street Address 2',
          required: false,
        }),
        address_city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        address_state: Property.ShortText({
          displayName: 'State/Province',
          required: false,
        }),
        address_zip_code: Property.ShortText({
          displayName: 'ZIP/Postal Code',
          required: false,
        }),
        address_country: Property.ShortText({
          displayName: 'Country Code',
          description: '2-letter ISO country code (e.g. US, GB).',
          required: false,
        }),
      },
    }),
    client_reference_id: Property.ShortText({
      displayName: 'Client Reference ID',
      description: 'Your own internal identifier for this user.',
      required: false,
    }),
    
    events_callback_url: Property.ShortText({
      displayName: 'Events Callback URL',
      description:
        'A webhook URL that AiPrise will call with event notifications for this profile. Paste the webhook URL from the **Verification Event Received** trigger here.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag names used to categorize this user profile. Tags are created if they do not already exist.',
      required: false,
    }),
  },
  async run(context) {
    const {
      first_name,
      middle_name,
      last_name,
      second_last_name,
      full_name,
      date_of_birth,
      email_address,
      phone_number,
      address,
      client_reference_id,
      events_callback_url,
      tags,
    } = context.propsValue;

    const body: Record<string, unknown> = {};

    if (first_name) body['first_name'] = first_name;
    if (middle_name) body['middle_name'] = middle_name;
    if (last_name) body['last_name'] = last_name;
    if (second_last_name) body['second_last_name'] = second_last_name;
    if (full_name) body['full_name'] = full_name;
    if (date_of_birth) body['date_of_birth'] = date_of_birth;
    if (email_address) body['email_address'] = email_address;
    if (phone_number) body['phone_number'] = phone_number;
    if (address) body['address'] = address;
    if (client_reference_id) body['client_reference_id'] = client_reference_id;
    if (events_callback_url) body['events_callback_url'] = events_callback_url;
    if (tags && tags.length > 0) body['tags'] = tags;

    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/create_user_profile',
      body,
    });
  },
});
