import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const createProfileAction = createAction({
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
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the profile (E.164 format recommended)',
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
    image: Property.ShortText({
      displayName: 'Image URL',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region/State',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Additional custom properties as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone, firstName, lastName, organization, title, image, city, country, region, zip, customProperties } = context.propsValue;

    if (!email && !phone) {
      throw new Error('Either email or phone number must be provided');
    }

    const properties: Record<string, unknown> = {};
    
    if (firstName) properties.first_name = firstName;
    if (lastName) properties.last_name = lastName;
    if (organization) properties.organization = organization;
    if (title) properties.title = title;
    if (image) properties.image = image;
    
    if (city || country || region || zip) {
      properties.location = {};
      if (city) (properties.location as Record<string, unknown>).city = city;
      if (country) (properties.location as Record<string, unknown>).country = country;
      if (region) (properties.location as Record<string, unknown>).region = region;
      if (zip) (properties.location as Record<string, unknown>).zip = zip;
    }

    if (customProperties) {
      properties.properties = customProperties;
    }

    return await klaviyoClient.createProfile(
      context.auth,
      email,
      phone,
      properties
    );
  },
});
