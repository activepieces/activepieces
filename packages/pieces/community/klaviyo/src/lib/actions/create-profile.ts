import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../../common';

export const createProfile = createAction({
  name: 'create_profile',
  auth: klaviyoAuth,
  displayName: 'Create Profile',
  description: 'Add a new user profile to Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g. +15551234567)',
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
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      required: false,
    }),
  },
  async run(context) {
    const { email, phoneNumber, firstName, lastName, organization, title, city, region, country, zip, customProperties } = context.propsValue;

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phoneNumber) attributes['phone_number'] = phoneNumber;
    if (firstName) attributes['first_name'] = firstName;
    if (lastName) attributes['last_name'] = lastName;
    if (organization) attributes['organization'] = organization;
    if (title) attributes['title'] = title;
    const location: Record<string, string> = {};
    if (city) location['city'] = city;
    if (region) location['region'] = region;
    if (country) location['country'] = country;
    if (zip) location['zip'] = zip;
    if (Object.keys(location).length > 0) attributes['location'] = location;
    if (customProperties && Object.keys(customProperties).length > 0) {
      attributes['properties'] = customProperties;
    }

    const response = await klaviyoApiCall(
      HttpMethod.POST,
      'profiles',
      context.auth.secret_text,
      {
        data: {
          type: 'profile',
          attributes,
        },
      }
    );
    return response.body;
  },
});
