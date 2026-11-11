import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { equalsFilter, klaviyoApi } from '../common/client';
import { normalizePhone } from '../common/props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const findProfileByEmailPhone = createAction({
  auth: klaviyoAuth,
  name: 'findProfileByEmailPhone',
  classification: 'READ',
  displayName: 'Find Profile by Email/Phone',
  description: 'Find a profile using email or phone number.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up a Klaviyo profile by exact email address or phone number and returns matching profiles with their IDs. The search value is auto-detected as an email (contains "@") or a phone number; phone numbers must be E.164 (spaces, dashes, dots and brackets are removed, and a missing leading + is added). Use to resolve a contact into a profile ID before update/subscribe/list actions; to browse profiles use List Profiles. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.findProfile,
  props: {
    search_query: Property.ShortText({
      displayName: 'Email or Phone Number',
      description:
        'Enter an email address or a phone number in E.164 format with the country code (e.g. +15005550006). Spaces, dashes, dots and brackets are removed before searching.',
      required: true,
    }),
    include_additional_data: Property.Checkbox({
      displayName: 'Include Additional Data',
      description: 'Include subscriptions and predictive analytics data',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search_query, include_additional_data } = propsValue;
    const trimmedQuery = (search_query ?? '').trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Email or phone number is required');
    }
    const isEmail = trimmedQuery.includes('@');
    let filter: string;
    let searched: string;
    if (isEmail) {
      if (!EMAIL.test(trimmedQuery)) {
        throw new Error('Please enter a valid email address');
      }
      searched = trimmedQuery;
      filter = equalsFilter({ field: 'email', value: trimmedQuery });
    } else {
      searched = normalizePhone(trimmedQuery);
      if (!E164.test(searched)) {
        throw new Error(
          'Please enter a valid phone number in E.164 format with the country code, e.g. +15005550006'
        );
      }
      filter = equalsFilter({ field: 'phone_number', value: searched });
    }
    const page = await klaviyoApi.listPage({
      auth,
      path: '/profiles',
      query: {
        filter,
        'page[size]': 100,
        'additional-fields[profile]': include_additional_data ? 'subscriptions,predictive_analytics' : undefined,
      },
    });
    const kind = isEmail ? 'email' : 'phone number';
    if (page.items.length === 0) {
      return {
        success: false,
        message: `No profile found with ${kind}: ${searched}`,
        profiles: [],
        count: 0,
      };
    }
    const formattedProfiles = page.items.map((profile) => {
      const firstName = profile.attributes['first_name'];
      const lastName = profile.attributes['last_name'];
      return {
        id: profile.id,
        email: profile.attributes['email'],
        phone_number: profile.attributes['phone_number'],
        first_name: firstName,
        last_name: lastName,
        external_id: profile.attributes['external_id'],
        full_name: [firstName, lastName].filter((part) => typeof part === 'string' && part !== '').join(' ') || null,
        created: profile.attributes['created'],
        updated: profile.attributes['updated'],
        full_profile: profile.attributes,
      };
    });
    return {
      success: true,
      message: `Found ${formattedProfiles.length} profile(s) matching ${kind}: ${searched}`,
      profiles: formattedProfiles,
      count: formattedProfiles.length,
      raw_response: { data: page.items },
    };
  },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const E164 = /^\+[1-9]\d{6,14}$/;
