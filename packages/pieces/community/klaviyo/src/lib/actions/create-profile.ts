import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'create_profile',
  displayName: 'Create Profile',
  description: 'Add a new user profile to Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile.',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +15551234567).',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
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
      displayName: 'Zip/Postal Code',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const attributes: Record<string, unknown> = {};
    if (propsValue.email) attributes['email'] = propsValue.email;
    if (propsValue.phoneNumber) attributes['phone_number'] = propsValue.phoneNumber;
    if (propsValue.firstName) attributes['first_name'] = propsValue.firstName;
    if (propsValue.lastName) attributes['last_name'] = propsValue.lastName;
    if (propsValue.title) attributes['title'] = propsValue.title;
    if (propsValue.organization) attributes['organization'] = propsValue.organization;
    const location: Record<string, string> = {};
    if (propsValue.city) location['city'] = propsValue.city;
    if (propsValue.region) location['region'] = propsValue.region;
    if (propsValue.country) location['country'] = propsValue.country;
    if (propsValue.zip) location['zip'] = propsValue.zip;
    if (Object.keys(location).length > 0) {
      attributes['location'] = location;
    }
    return await klaviyoApiCall(auth as string, HttpMethod.POST, '/profiles', {
      data: {
        type: 'profile',
        attributes,
      },
    });
  },
});
