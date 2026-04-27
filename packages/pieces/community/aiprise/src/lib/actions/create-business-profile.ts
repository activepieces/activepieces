import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aiprise } from '../common';
import { aipriseAuth } from '../../';

export const createBusinessProfileAction = createAction({
  auth: aipriseAuth,
  name: 'create_business_profile',
  displayName: 'Create Business Profile',
  description:
    'Creates a new business profile in AiPrise. The returned profile can then be used to run document checks or other business verifications.',
  props: {
    name: Property.ShortText({
      displayName: 'Business Name',
      description: 'The business name. The legal name is preferred.',
      required: true,
    }),
    alternate_name: Property.ShortText({
      displayName: 'Alternate Name (DBA)',
      description: 'An alternate "doing business as" name, if any.',
      required: false,
    }),
    tax_identification_number: Property.ShortText({
      displayName: 'Tax Identification Number',
      description: 'The tax ID for this business (e.g. EIN in the US).',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The business website URL.',
      required: false,
    }),
    formation_date: Property.ShortText({
      displayName: 'Formation Date',
      description: 'The date the business was formed, in YYYY-MM-DD format.',
      required: false,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'The 2-letter ISO country code where the business is registered (e.g. US, GB).',
      required: false,
    }),
    state_code: Property.ShortText({
      displayName: 'State Code',
      description: 'The state or province code where the business is registered (e.g. CA, NY).',
      required: false,
    }),
    business_entity_id: Property.ShortText({
      displayName: 'Business Entity ID',
      description: 'A government-issued entity identifier for this business.',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      description: 'A JSON array of address objects associated with the business.',
      required: false,
      properties: {
        address_street_1: Property.ShortText({
          displayName: 'Street Address 1',
          required: false,
        }),
        address_street_2: Property.ShortText({
          displayName: 'Street Address 2',
          required: false,
        }),
        address_city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        address_state: Property.ShortText({
          displayName: 'State/Province',
          required: false,
        }),
        address_zip_code: Property.ShortText({
          displayName: 'ZIP/Postal Code',
          required: false,
        }),
        address_country: Property.ShortText({
          displayName: 'Country Code',
          description: '2-letter ISO country code (e.g. US, GB).',
          required: false,
        }),
      },
    }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'One or more phone numbers associated with the business.',
      required: false,
    }),
    email_addresses: Property.Array({
      displayName: 'Email Addresses',
      description: 'One or more email addresses associated with the business.',
      required: false,
    }),
    additional_information: Property.Array({
      displayName: 'Additional Information',
      description: 'A JSON array of supporting documents or extra data for this business.',
      required: false,
    }),
    client_reference_id: Property.ShortText({
      displayName: 'Client Reference ID',
      description: 'Your own internal identifier for this business.',
      required: false,
    }),
   
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'A webhook URL that AiPrise will call with verification results.',
      required: false,
    }),
    events_callback_url: Property.ShortText({
      displayName: 'Events Callback URL',
      description: 'A webhook URL that AiPrise will call with event notifications.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tag names used to categorize this business profile.',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      alternate_name,
      tax_identification_number,
      website,
      formation_date,
      country_code,
      state_code,
      business_entity_id,
      addresses,
      phone_numbers,
      email_addresses,
      additional_information,
      client_reference_id,
      callback_url,
      events_callback_url,
      tags,
    } = context.propsValue;

    const body: Record<string, unknown> = { name };

    if (alternate_name) body['alternate_name'] = alternate_name;
    if (tax_identification_number) body['tax_identification_number'] = tax_identification_number;
    if (website) body['website'] = website;
    if (formation_date) body['formation_date'] = formation_date;
    if (country_code) body['country_code'] = country_code;
    if (state_code) body['state_code'] = state_code;
    if (business_entity_id) body['business_entity_id'] = business_entity_id;
    if (addresses && addresses.length > 0) body['addresses'] = addresses;
    if (phone_numbers && phone_numbers.length > 0) body['phone_numbers'] = phone_numbers;
    if (email_addresses && email_addresses.length > 0) body['email_addresses'] = email_addresses;
    if (additional_information) body['additional_information'] = additional_information;
    if (client_reference_id) body['client_reference_id'] = client_reference_id;
    if (callback_url) body['callback_url'] = callback_url;
    if (events_callback_url) body['events_callback_url'] = events_callback_url;
    if (tags && tags.length > 0) body['tags'] = tags;

    return aiprise.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/verify/create_business_profile',
      body,
    });
  },
});
