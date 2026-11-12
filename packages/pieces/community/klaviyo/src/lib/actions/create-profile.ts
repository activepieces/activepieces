import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { duplicateProfileId, KlaviyoApiError, klaviyoApi } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'createProfile',
  classification: 'WRITE',
  displayName: 'Create Profile',
  description: 'Add a new profile. Fails if a profile with the same email, phone number or external ID already exists; use Create or Update Profile to upsert.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a new profile (contact) in Klaviyo with identity, location, and custom-property attributes. Fails with HTTP 409 and the existing profile ID when the email, phone number or external ID is already in use. Does not change marketing consent. Not idempotent.',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.rawProfile,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address (recommended identifier)',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +15005550006)',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Unique identifier from external system',
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
      description: 'Company name',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Language tag (e.g., en-US)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      description: 'Profile image URL',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address 1',
      description: 'Street address line 1',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address 2',
      description: 'Street address line 2',
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
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone (e.g., America/New_York)',
      required: false,
    }),
    ip: Property.ShortText({
      displayName: 'IP Address',
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
      description: 'Key-value pairs for segmentation and personalization',
      required: false,
    }),
    include_subscriptions: Property.Checkbox({
      displayName: 'Include Subscriptions',
      description: 'Return subscription data in response',
      required: false,
      defaultValue: false,
    }),
    include_predictive_analytics: Property.Checkbox({
      displayName: 'Include Predictive Analytics',
      description: 'Return predictive analytics in response',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const attributes = klaviyoInputs.profileAttributes(propsValue);
    if (attributes['email'] === undefined && attributes['phone_number'] === undefined && attributes['external_id'] === undefined) {
      throw new Error(
        'At least one identifier is required: email, phone_number, or external_id'
      );
    }
    const additionalFields = [
      propsValue.include_subscriptions ? 'subscriptions' : undefined,
      propsValue.include_predictive_analytics ? 'predictive_analytics' : undefined,
    ].filter((field): field is string => field !== undefined);
    try {
      const response = await klaviyoApi.send({
        auth,
        method: HttpMethod.POST,
        path: '/profiles',
        query: { 'additional-fields[profile]': additionalFields.join(',') },
        body: { data: { type: 'profile', attributes } },
      });
      return response.body;
    } catch (error) {
      if (error instanceof KlaviyoApiError && error.status === 409) {
        const existingId = duplicateProfileId(error.responseBody);
        throw new KlaviyoApiError({
          method: HttpMethod.POST,
          path: '/profiles',
          status: 409,
          responseBody: error.responseBody,
          hint: existingId === undefined
            ? 'A profile with this identifier already exists. Use Update Profile or Create or Update Profile instead.'
            : `A profile with this identifier already exists (profile ID ${existingId}). Use Update Profile or Create or Update Profile instead.`,
        });
      }
      throw error;
    }
  },
});
