import { createAction, Property } from '@activepieces/pieces-framework';
import { paywhirlAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCustomer = createAction({
  auth: paywhirlAuth,
  name: 'createCustomer',
  displayName: 'Create Customer',
  description:
    'Create a new customer. This is required before binding a customer to a plan via a subscription.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (ex. USD, GBP, AUD, CAD, EUR, etc)',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description:
        'Password (leave blank to let customer assign via secure link in welcome email)',
      required: false,
    }),
    phone: Property.Number({
      displayName: 'Phone Number',
      description: 'Phone number',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Street Address',
      description: 'Street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Region',
      description: 'State / Region',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip / Postal Code',
      description: 'Zip / Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country Code',
      description: 'Country Code (ex. US, GB, CA, AU, etc)',
      required: false,
    }),
    gateway_id: Property.ShortText({
      displayName: 'Payment Gateway ID',
      description:
        'PayWhirl ID of payment gateway to attach to customer. If left blank, first loaded gateway will be used.',
      required: false,
    }),
    utm_source: Property.ShortText({
      displayName: 'UTM Source',
      description: 'Acquisition source (ex. google, bing, email, fall_campaign, etc)',
      required: false,
    }),
    utm_medium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'Acquisition medium (ex. CPC, banner, text_ad, etc)',
      required: false,
    }),
    utm_term: Property.ShortText({
      displayName: 'UTM Term',
      description: 'Acquisition keyword',
      required: false,
    }),
    utm_content: Property.ShortText({
      displayName: 'UTM Content',
      description: 'Acquisition Ad Content',
      required: false,
    }),
    utm_campaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'Acquisition Ad Campaign',
      required: false,
    }),
    utm_group: Property.ShortText({
      displayName: 'UTM Group',
      description: 'Acquisition Ad Group',
      required: false,
    }),
  },
  async run(context) {
    const {
      first_name,
      last_name,
      email,
      currency,
      password,
      phone,
      address,
      city,
      state,
      zip,
      country,
      gateway_id,
      utm_source,
      utm_medium,
      utm_term,
      utm_content,
      utm_campaign,
      utm_group,
    } = context.propsValue;

    const body: any = {
      first_name,
      last_name,
      email,
      currency,
    };

    if (password) body.password = password;
    if (phone) body.phone = phone;
    if (address) body.address = address;
    if (city) body.city = city;
    if (state) body.state = state;
    if (zip) body.zip = zip;
    if (country) body.country = country;
    if (gateway_id) body.gateway_id = gateway_id;
    if (utm_source) body.utm_source = utm_source;
    if (utm_medium) body.utm_medium = utm_medium;
    if (utm_term) body.utm_term = utm_term;
    if (utm_content) body.utm_content = utm_content;
    if (utm_campaign) body.utm_campaign = utm_campaign;
    if (utm_group) body.utm_group = utm_group;

    const response = await makeRequest(
      context.auth.props.api_key,
      context.auth.props.api_secret,
      HttpMethod.POST,
      '/create/customer',
      body
    );

    return response;
  },
});
