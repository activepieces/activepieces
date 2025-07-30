import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface KlaviyoProfile {
  type: string;
  id: string;
  attributes: {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    external_id?: string;
    organization?: string;
    locale?: string;
    title?: string;
    image?: string;
    created?: string;
    updated?: string;
    last_event_date?: string;
    location?: object;
    properties?: object;
  };
}

export const findProfileByEmailPhone = createAction({
  auth: klaviyoAuth,
  name: 'findProfileByEmailPhone',
  displayName: 'Find Profile by Email/Phone',
  description: 'Find a profile using email or phone number.',
  props: {
    search_query: Property.ShortText({
      displayName: 'Email or Phone Number',
      description: 'Enter an email address or phone number (E.164 format recommended)',
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

    if (!search_query || search_query.trim().length === 0) {
      throw new Error('Email or phone number is required');
    }

    const trimmedQuery = search_query.trim();
    
    let filter = '';
    const isEmail = trimmedQuery.includes('@');
    
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedQuery)) {
        throw new Error('Please enter a valid email address');
      }
      filter = `equals(email,"${trimmedQuery}")`;
    } else {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/;
      if (!phoneRegex.test(trimmedQuery)) {
        throw new Error('Please enter a valid phone number (E.164 format recommended, e.g., +1234567890)');
      }
      filter = `equals(phone_number,"${trimmedQuery}")`;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('filter', filter);
    queryParams.append('page[size]', '50');
    
    if (include_additional_data) {
      queryParams.append('additional-fields[profile]', 'subscriptions,predictive_analytics');
    }

    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    const response = await makeRequest(
      authProp.access_token,
      HttpMethod.GET,
      `/profiles?${queryParams.toString()}`
    );

    const profiles: KlaviyoProfile[] = response.data || [];
    
    if (profiles.length === 0) {
      return {
        success: false,
        message: `No profile found with ${isEmail ? 'email' : 'phone number'}: ${trimmedQuery}`,
        profiles: [],
        count: 0,
      };
    }

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      email: profile.attributes.email,
      phone_number: profile.attributes.phone_number,
      first_name: profile.attributes.first_name,
      last_name: profile.attributes.last_name,
      external_id: profile.attributes.external_id,
      full_name: [profile.attributes.first_name, profile.attributes.last_name]
        .filter(Boolean)
        .join(' ') || null,
      created: profile.attributes.created,
      updated: profile.attributes.updated,
      full_profile: profile.attributes,
    }));

    return {
      success: true,
      message: `Found ${profiles.length} profile(s) matching ${isEmail ? 'email' : 'phone number'}: ${trimmedQuery}`,
      profiles: formattedProfiles,
      count: profiles.length,
      raw_response: response,
    };
  },
});
