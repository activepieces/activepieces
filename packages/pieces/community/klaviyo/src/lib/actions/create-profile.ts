import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const createProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'create_profile',
  displayName: 'Create Profile',
  description: 'Create a new profile in Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +15005550006)',
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
      displayName: 'Title / Job Title',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      required: false,
    }),
    location_address1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    location_city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    location_region: Property.ShortText({
      displayName: 'State / Region',
      required: false,
    }),
    location_country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    location_zip: Property.ShortText({
      displayName: 'ZIP / Postal Code',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Additional custom properties as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      phone_number,
      first_name,
      last_name,
      organization,
      title,
      image,
      location_address1,
      location_city,
      location_region,
      location_country,
      location_zip,
      properties,
    } = context.propsValue;

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phone_number) attributes['phone_number'] = phone_number;
    if (first_name) attributes['first_name'] = first_name;
    if (last_name) attributes['last_name'] = last_name;
    if (organization) attributes['organization'] = organization;
    if (title) attributes['title'] = title;
    if (image) attributes['image'] = image;

    const location: Record<string, unknown> = {};
    if (location_address1) location['address1'] = location_address1;
    if (location_city) location['city'] = location_city;
    if (location_region) location['region'] = location_region;
    if (location_country) location['country'] = location_country;
    if (location_zip) location['zip'] = location_zip;
    if (Object.keys(location).length > 0) attributes['location'] = location;

    if (properties && Object.keys(properties).length > 0) {
      attributes['properties'] = properties;
    }

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/profiles',
      body: {
        data: {
          type: 'profile',
          attributes,
        },
      },
    });
  },
});
