import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'createProfile',
  displayName: 'Create Profile',
  description: 'Add new user profile with email/SMS subscription options',
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
  async run({auth, propsValue}) {
    const {
      email,
      phone_number,
      external_id,
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
      include_predictive_analytics
    } = propsValue;

    if (!email && !phone_number && !external_id) {
      throw new Error('At least one identifier is required: email, phone_number, or external_id');
    }

    const attributes: Record<string, any> = {};
    
    if (email) attributes['email'] = email;
    if (phone_number) attributes['phone_number'] = phone_number;
    if (external_id) attributes['external_id'] = external_id;
    
    if (first_name) attributes['first_name'] = first_name;
    if (last_name) attributes['last_name'] = last_name;
    if (organization) attributes['organization'] = organization;
    if (locale) attributes['locale'] = locale;
    if (title) attributes['title'] = title;
    if (image) attributes['image'] = image;
    
    const hasLocationData = address1 || address2 || city || country || region || zip || timezone || ip || latitude || longitude;
    if (hasLocationData) {
      attributes['location'] = {};
      if (address1) attributes['location']['address1'] = address1;
      if (address2) attributes['location']['address2'] = address2;
      if (city) attributes['location']['city'] = city;
      if (country) attributes['location']['country'] = country;
      if (region) attributes['location']['region'] = region;
      if (zip) attributes['location']['zip'] = zip;
      if (timezone) attributes['location']['timezone'] = timezone;
      if (ip) attributes['location']['ip'] = ip;
      if (latitude) attributes['location']['latitude'] = latitude;
      if (longitude) attributes['location']['longitude'] = longitude;
    }

    if (custom_properties) {
      attributes['properties'] = custom_properties;
    }

    const body = {
      data: {
        type: 'profile',
        attributes,
      },
    };

    const queryParams = new URLSearchParams();
    const additionalFields = [];
    
    if (include_subscriptions) {
      additionalFields.push('subscriptions');
    }
    if (include_predictive_analytics) {
      additionalFields.push('predictive_analytics');
    }
    
    if (additionalFields.length > 0) {
      queryParams.append('additional-fields[profile]', additionalFields.join(','));
    }

    const endpoint = `/profiles${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    return await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      endpoint,
      body
    );
  },
});
