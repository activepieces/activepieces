import { createAction, Property } from '@activepieces/pieces-framework';
import { profileIdDropdown, countryCode } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApi, pathFor } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const updateProfile = createAction({
  auth: klaviyoAuth,
  name: 'updateProfile',
  classification: 'WRITE',
  displayName: 'Update Profile',
  description: 'Update existing profile data and preferences.',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Klaviyo profile by its profile ID, overwriting only the supplied identity, location, and custom-property fields. Does not change marketing consent. Idempotent: re-running with the same input leaves the profile in the same state.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.rawProfile,
  props: {
    profile_id: profileIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: "Individual's email address",
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +15005550006)',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Unique identifier from external system (e.g., POS system)',
      required: false,
    }),
    anonymous_id: Property.ShortText({
      displayName: 'Anonymous ID',
      description: 'Anonymous identifier for the profile',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Individual's first name",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Individual's last name",
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Company or organization name',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Locale in IETF BCP 47 format (e.g., en-US)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: "Individual's job title",
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL pointing to profile image location',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address 1',
      description: 'First line of street address',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address 2',
      description: 'Second line of street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City name',
      required: false,
    }),
    country: countryCode,
    region: Property.ShortText({
      displayName: 'Region',
      description: 'Region within country (state/province)',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      description: 'Postal/zip code',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone (e.g., America/New_York)',
      required: false,
    }),
    ip: Property.ShortText({
      displayName: 'IP Address',
      description: 'IP address of the profile',
      required: false,
    }),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Latitude coordinate (4 decimal places recommended)',
      required: false,
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Longitude coordinate (4 decimal places recommended)',
      required: false,
    }),
    custom_properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Key/value pairs for custom profile properties',
      required: false,
    }),
    include_subscriptions: Property.Checkbox({
      displayName: 'Include Subscriptions',
      description: 'Include subscription data in response',
      required: false,
      defaultValue: false,
    }),
    include_predictive_analytics: Property.Checkbox({
      displayName: 'Include Predictive Analytics',
      description: 'Include predictive analytics data in response',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const profileId = klaviyoInputs.requireText({ value: propsValue.profile_id, label: 'Profile Id' });
    const attributes: Record<string, unknown> = {};
    const textFields: UpdateTextField[] = ['email', 'phone_number', 'external_id', 'anonymous_id', 'first_name', 'last_name', 'organization', 'locale', 'title', 'image'];
    for (const field of textFields) {
      const value = propsValue[field];
      if (value !== undefined) {
        attributes[field] = value;
      }
    }
    const location: Record<string, unknown> = {};
    const locationFields: UpdateLocationField[] = ['address1', 'address2', 'city', 'country', 'region', 'zip', 'timezone', 'ip', 'latitude', 'longitude'];
    for (const field of locationFields) {
      const value = propsValue[field];
      if (value !== undefined) {
        location[field] = value;
      }
    }
    if (Object.keys(location).length > 0) {
      attributes['location'] = location;
    }
    if (propsValue.custom_properties !== undefined) {
      attributes['properties'] = propsValue.custom_properties;
    }
    const additionalFields = [
      propsValue.include_subscriptions ? 'subscriptions' : undefined,
      propsValue.include_predictive_analytics ? 'predictive_analytics' : undefined,
    ].filter((field): field is string => field !== undefined);
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.PATCH,
      path: pathFor(['profiles', profileId]),
      query: { 'additional-fields[profile]': additionalFields.join(',') },
      body: { data: { type: 'profile', id: profileId, attributes } },
    });
    return response.body;
  },
});

type UpdateTextField = 'email' | 'phone_number' | 'external_id' | 'anonymous_id' | 'first_name' | 'last_name' | 'organization' | 'locale' | 'title' | 'image';

type UpdateLocationField = 'address1' | 'address2' | 'city' | 'country' | 'region' | 'zip' | 'timezone' | 'ip' | 'latitude' | 'longitude';
