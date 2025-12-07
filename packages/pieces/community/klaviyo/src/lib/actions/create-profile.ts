import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'create_profile',
  displayName: 'Create Profile',
  description: 'Create a new profile in Klaviyo',
  props: {
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
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier from an external system',
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
    const { email, phone_number, external_id, first_name, last_name, organization, title, image, location, properties } = context.propsValue;

    if (!email && !phone_number && !external_id) {
      throw new Error('At least one of email, phone_number, or external_id is required');
    }

    const profileData: any = {
      type: 'profile',
      attributes: {},
    };

    if (email) profileData.attributes.email = email;
    if (phone_number) profileData.attributes.phone_number = phone_number;
    if (external_id) profileData.attributes.external_id = external_id;
    if (first_name) profileData.attributes.first_name = first_name;
    if (last_name) profileData.attributes.last_name = last_name;
    if (organization) profileData.attributes.organization = organization;
    if (title) profileData.attributes.title = title;
    if (image) profileData.attributes.image = image;
    if (location) profileData.attributes.location = location;
    if (properties) profileData.attributes.properties = properties;

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/profiles',
      { data: profileData }
    );

    return response.body;
  },
});
