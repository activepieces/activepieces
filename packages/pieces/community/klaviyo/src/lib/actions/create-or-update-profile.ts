import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { isRecord, klaviyoApi } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const createOrUpdateProfile = createAction({
  auth: klaviyoAuth,
  name: 'create_or_update_profile',
  classification: 'WRITE',
  displayName: 'Create or Update Profile',
  description: 'Create a profile, or update the existing one with the same email, phone number, external ID or profile ID. Fields you leave empty keep their current values. Does not change marketing consent.',
  audience: 'both',
  aiMetadata: {
    description: 'Upserts a Klaviyo profile: matches an existing profile by Profile ID, email, phone number or external ID and updates only the fields given, or creates a new profile when none matches. Use this to add or edit a person; it never changes email/SMS marketing consent (use Subscribe Profile to Marketing for that). Returns the profile and created=true when a new profile was made. When Profile ID is given, the email, phone number and external ID are written onto that profile even if another profile already uses them, which can leave two profiles with the same email. Idempotent: repeating it leaves the same profile in the same state.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.upsertProfile,
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Optional. The Klaviyo profile ID to update. Find it with Find Profile by Email/Phone or List Profiles.',
      required: false,
    }),
    email: Property.ShortText({ displayName: 'Email', description: 'Email address.', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', description: 'Phone number in E.164 format (e.g. +15005550006).', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Your own identifier for this person.', required: false }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    organization: Property.ShortText({ displayName: 'Organization', description: 'Company name.', required: false }),
    locale: Property.ShortText({ displayName: 'Locale', description: 'Language tag (e.g. en-US).', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    image: Property.ShortText({ displayName: 'Image URL', required: false }),
    address1: Property.ShortText({ displayName: 'Address 1', required: false }),
    address2: Property.ShortText({ displayName: 'Address 2', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    region: Property.ShortText({ displayName: 'Region/State', required: false }),
    zip: Property.ShortText({ displayName: 'Zip Code', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone (e.g. America/New_York).', required: false }),
    ip: Property.ShortText({ displayName: 'IP Address', required: false }),
    latitude: Property.Number({ displayName: 'Latitude', required: false }),
    longitude: Property.Number({ displayName: 'Longitude', required: false }),
    custom_properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Key-value pairs merged into the profile properties. Keys you leave out keep their values.',
      required: false,
    }),
    include_subscriptions: klaviyoInputs.yesNoProp({
      displayName: 'Include Subscriptions',
      description: 'Yes returns the profile consent status in the output. Leave empty for no.',
    }),
  },
  async run({ auth, propsValue }) {
    const profileId = klaviyoInputs.optionalText(propsValue.profile_id);
    const attributes = klaviyoInputs.profileAttributes(propsValue);
    if (profileId === undefined && attributes['email'] === undefined && attributes['phone_number'] === undefined && attributes['external_id'] === undefined) {
      throw new Error('Provide at least one of Profile ID, Email, Phone Number or External ID.');
    }
    const includeSubscriptions = klaviyoInputs.yesNo({ value: propsValue.include_subscriptions, label: 'Include Subscriptions' });
    const response = await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/profile-import',
      query: { 'additional-fields[profile]': includeSubscriptions ? 'subscriptions' : undefined },
      body: {
        data: {
          type: 'profile',
          ...(profileId === undefined ? {} : { id: profileId }),
          attributes,
        },
      },
    });
    const body = isRecord(response.body) ? response.body : {};
    return { ...body, created: response.status === 201 };
  },
});
