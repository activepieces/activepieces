import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'create_profile',
  displayName: 'Create Profile',
  description: 'Create a new profile in Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for the profile.',
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
  async run(context) {
    const {
      email,
      phoneNumber,
      firstName,
      lastName,
      title,
      organization,
      city,
      region,
      country,
      zip,
    } = context.propsValue;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required.');
    }

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phoneNumber) attributes['phone_number'] = phoneNumber;
    if (firstName) attributes['first_name'] = firstName;
    if (lastName) attributes['last_name'] = lastName;
    if (title) attributes['title'] = title;
    if (organization) attributes['organization'] = organization;

    const location: Record<string, string> = {};
    if (city) location['city'] = city;
    if (region) location['region'] = region;
    if (country) location['country'] = country;
    if (zip) location['zip'] = zip;
    if (Object.keys(location).length > 0) {
      attributes['location'] = location;
    }

    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.POST,
      '/profiles',
      {
        data: {
          type: 'profile',
          attributes,
        },
      },
    );
  },
});
