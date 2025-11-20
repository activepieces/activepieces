import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';

export const createProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_create_profile',
  displayName: 'Create Profile',
  description: 'Creates a new profile in Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Email address (at least one of email or phone is required)',
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
      description: 'Phone number in E.164 format (e.g., +12345678900)',
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      required: false,
      description: 'External ID from your system',
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
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'State/Region',
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
    timezone: Property.ShortText({
      displayName: 'Timezone',
      required: false,
      description: 'IANA timezone (e.g., America/New_York)',
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      required: false,
      description: 'Additional custom properties as JSON object',
    }),
  },
  async run(context) {
    const {
      email,
      phone_number,
      external_id,
      first_name,
      last_name,
      organization,
      title,
      image,
      address1,
      address2,
      city,
      region,
      country,
      zip,
      timezone,
      properties,
    } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('At least one of email or phone number is required');
    }

    const location: any = {};
    if (address1) location.address1 = address1;
    if (address2) location.address2 = address2;
    if (city) location.city = city;
    if (region) location.region = region;
    if (country) location.country = country;
    if (zip) location.zip = zip;
    if (timezone) location.timezone = timezone;

    const client = makeClient(context.auth);
    return await client.createProfile({
      email,
      phone_number,
      external_id,
      first_name,
      last_name,
      organization,
      title,
      image,
      location: Object.keys(location).length > 0 ? location : undefined,
      properties,
    });
  },
});

