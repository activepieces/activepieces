import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, KlaviyoProfile } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'update-profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +12345678901)',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system',
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
      displayName: 'Zip/Postal Code',
      required: false,
    }),
  },
  async run(context) {
    const {
      profile_id,
      email,
      phone_number,
      external_id,
      first_name,
      last_name,
      organization,
      title,
      image,
      city,
      country,
      region,
      zip,
    } = context.propsValue;

    const profile: KlaviyoProfile = {
      type: 'profile',
      id: profile_id,
      attributes: {},
    };

    // Only include fields that are provided
    if (email !== undefined) profile.attributes.email = email;
    if (phone_number !== undefined) profile.attributes.phone_number = phone_number;
    if (external_id !== undefined) profile.attributes.external_id = external_id;
    if (first_name !== undefined) profile.attributes.first_name = first_name;
    if (last_name !== undefined) profile.attributes.last_name = last_name;
    if (organization !== undefined) profile.attributes.organization = organization;
    if (title !== undefined) profile.attributes.title = title;
    if (image !== undefined) profile.attributes.image = image;

    // Add location if any location fields are provided
    if (city || country || region || zip) {
      profile.attributes.location = {};
      if (city !== undefined) profile.attributes.location.city = city;
      if (country !== undefined) profile.attributes.location.country = country;
      if (region !== undefined) profile.attributes.location.region = region;
      if (zip !== undefined) profile.attributes.location.zip = zip;
    }

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.PATCH,
      `/profiles/${profile_id}/`,
      { data: profile }
    );

    return response;
  },
});
