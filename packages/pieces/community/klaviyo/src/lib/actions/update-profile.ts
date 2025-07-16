import { createAction, Property } from '@activepieces/pieces-framework';
import { profileIdDropdown, countryCode } from '../common/props';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateProfile = createAction({
  auth: klaviyoAuth,
  name: 'updateProfile',
  displayName: 'Update Profile',
  description: 'Update existing profile data and preferences.',
  props: {
    profile_id: profileIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: "Individual's email address",
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number', 
      description: "Phone number in E.164 format (e.g., +15005550006)",
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
    // Location fields
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
    const {
      profile_id,
      email,
      phone_number,
      external_id,
      anonymous_id,
      first_name,
      last_name,
      organization,
      locale,
      title,
      image,
      address1,
      address2,
      city,
      country,
      region,
      zip,
      timezone,
      ip,
      latitude,
      longitude,
      custom_properties,
      include_subscriptions,
      include_predictive_analytics,
    } = propsValue;

    const attributes: Record<string, any> = {};
    
    if (email !== undefined) attributes['email'] = email;
    if (phone_number !== undefined) attributes['phone_number'] = phone_number;
    if (external_id !== undefined) attributes['external_id'] = external_id;
    if (anonymous_id !== undefined) attributes['anonymous_id'] = anonymous_id;
    if (first_name !== undefined) attributes['first_name'] = first_name;
    if (last_name !== undefined) attributes['last_name'] = last_name;
    if (organization !== undefined) attributes['organization'] = organization;
    if (locale !== undefined) attributes['locale'] = locale;
    if (title !== undefined) attributes['title'] = title;
    if (image !== undefined) attributes['image'] = image;

    const hasLocationData = address1 !== undefined || address2 !== undefined || 
                           city !== undefined || country !== undefined || 
                           region !== undefined || zip !== undefined || 
                           timezone !== undefined || ip !== undefined || 
                           latitude !== undefined || longitude !== undefined;
    
    if (hasLocationData) {
      const location: Record<string, any> = {};
      if (address1 !== undefined) location['address1'] = address1;
      if (address2 !== undefined) location['address2'] = address2;
      if (city !== undefined) location['city'] = city;
      if (country !== undefined) location['country'] = country;
      if (region !== undefined) location['region'] = region;
      if (zip !== undefined) location['zip'] = zip;
      if (timezone !== undefined) location['timezone'] = timezone;
      if (ip !== undefined) location['ip'] = ip;
      if (latitude !== undefined) location['latitude'] = latitude;
      if (longitude !== undefined) location['longitude'] = longitude;
      
      attributes['location'] = location;
    }

    if (custom_properties !== undefined) {
      attributes['properties'] = custom_properties;
    }

    const body = {
      data: {
        type: 'profile',
        id: profile_id,
        attributes,
      },
    };

    const queryParams: string[] = [];
    const additionalFields: string[] = [];
    
    if (include_subscriptions) {
      additionalFields.push('subscriptions');
    }
    if (include_predictive_analytics) {
      additionalFields.push('predictive_analytics');
    }
    
    if (additionalFields.length > 0) {
      queryParams.push(`additional-fields[profile]=${additionalFields.join(',')}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    return await makeRequest(
      auth.access_token,
      HttpMethod.PATCH,
      `/profiles/${profile_id}${queryString}`,
      body
    );
  },
});
