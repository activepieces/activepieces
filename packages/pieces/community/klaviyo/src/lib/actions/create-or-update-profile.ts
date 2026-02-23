import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const createOrUpdateProfile = createAction({
  name: 'create_or_update_profile',
  auth: klaviyoAuth,
  displayName: 'Create or Update Profile',
  description: 'Create a new profile or update an existing one by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region/State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      required: false,
    }),
  },
  async run(context) {
    const profileData: Record<string, any> = {
      email: context.propsValue.email,
    };
    // Add optional fields if provided
    const optionalFields = [
      'first_name', 'last_name', 'phone_number', 'city', 'region', 'country',
      'zip', 'address1', 'address2', 'title', 'organization', 'timezone'
    ] as const;
    optionalFields.forEach(field => {
      const value = context.propsValue[field];
      if (value !== undefined && value !== '' && value !== null) {
        profileData[field] = value;
      }
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://a.klaviyo.com/api/profiles',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          type: 'profile',
          attributes: profileData,
        },
      },
    });
    return response.body;
  },
});