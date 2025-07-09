import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { countryCodeDropdown, countryDropdown } from '../common/props';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'createProfile',
  displayName: 'Create Profile',
  description: 'Add a new user profile to Klaviyo, optionally subscribing to email/SMS.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: "Individual's email address",
      required: true,
    }),
    country_code: countryCodeDropdown,
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: "Individual's phone number in E.164 format",
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier for the profile in an external system',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Individual's first name",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Individual's last name",
      required: true,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      description: 'Company or organization name',
      required: true,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Locale (IETF BCP 47 language tag, e.g., en-US)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title eg. Regional Manager',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL to profile image',
      required: false,
    }),
    address1: Property.ShortText({
      displayName: 'Address 1',
      description: "Street address",
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address 2',
      description: "Street address",
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: countryDropdown,
  },
  async run(context) {

    const { api_key } = context.auth
    const {
      email,
      country_code,
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
      country
    } = context.propsValue;

    const attributes: Record<string, any> = {};
    if (email) attributes['email'] = email;
    if (phone_number) attributes['phone_number'] = country_code + phone_number;
    if (external_id) attributes['external_id'] = external_id;
    if (first_name) attributes['first_name'] = first_name;
    if (last_name) attributes['last_name'] = last_name;
    if (organization) attributes['organization'] = organization;
    if (locale) attributes['locale'] = locale;
    if (title) attributes['title'] = title;
    if (image) attributes['image'] = image;
    if (country) attributes['location'] = {
      address1, address2, city, country
    };


    const body = {
      data: {
        type: 'profile',
        attributes,
      },
    };
    return await makeRequest(
      api_key,
      HttpMethod.POST,
      '/profiles',
      body
    );
  },
});
