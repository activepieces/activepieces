import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateProfile = createAction({
  auth: klaviyoAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +12025551234)',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL to profile image',
      required: false,
    }),
    location: Property.Json({
      displayName: 'Location',
      description: 'Location object with address, city, region, country, zip, timezone',
      required: false,
    }),
    properties: Property.Json({
      displayName: 'Custom Properties',
      description: 'Additional custom properties as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const { profile_id, email, phone_number, first_name, last_name, organization, title, image, location, properties } = context.propsValue;

    const profileData: any = {
      type: 'profile',
      id: profile_id,
      attributes: {},
    };

    if (email) profileData.attributes.email = email;
    if (phone_number) profileData.attributes.phone_number = phone_number;
    if (first_name) profileData.attributes.first_name = first_name;
    if (last_name) profileData.attributes.last_name = last_name;
    if (organization) profileData.attributes.organization = organization;
    if (title) profileData.attributes.title = title;
    if (image) profileData.attributes.image = image;
    if (location) profileData.attributes.location = location;
    if (properties) profileData.attributes.properties = properties;

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.PATCH,
      `/profiles/${profile_id}`,
      { data: profileData }
    );

    return response.body;
  },
});
