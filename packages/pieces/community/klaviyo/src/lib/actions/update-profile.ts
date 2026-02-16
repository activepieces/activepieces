import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const updateProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo',
  props: {
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the profile to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number (E.164 format recommended)',
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
    const { profileId, email, phone, firstName, lastName, organization, title, image, city, country, region, zip, customProperties } = context.propsValue;

    const properties: Record<string, unknown> = {};
    
    if (email) properties.email = email;
    if (phone) properties.phone_number = phone;
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

    return await klaviyoClient.updateProfile(
      context.auth,
      profileId,
      properties
    );
  },
});
