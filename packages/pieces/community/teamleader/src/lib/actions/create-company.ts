import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  addresses,
  addressTypeDropdown,
  businessTypeIdDropdown,
  countryDropdown,
  emailTypeDropdown,
  phoneTypeDropdown,
} from '../common/props';

export const createCompany = createAction({
  auth: teamleaderAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description:
    'Create a new company record in Teamleader with all relevant details',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Enter the official name of the company (required)',
      required: true,
    }),
    business_type_id: businessTypeIdDropdown,
    vatNumber: Property.ShortText({
      displayName: 'VAT Number',
      description:
        "Enter the company's VAT registration number (e.g., BE0899623035)",
      required: false,
    }),
    national_identification_number: Property.ShortText({
      displayName: 'National ID Number',
      description:
        "Enter the company's national identification number (if applicable)",
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Add one or more email addresses for the company',
      required: false,
      properties: {
        type: emailTypeDropdown,
        email: Property.ShortText({
          displayName: 'Email Address',
          description: 'Enter a valid email address',
          required: true,
        }),
      },
    }),
    telephones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Add one or more phone numbers for the company',
      required: false,
      properties: {
        type: phoneTypeDropdown,
        number: Property.ShortText({
          displayName: 'Phone Number',
          description:
            'Enter the phone number (including country code if applicable)',
          required: true,
        }),
      },
    }),
    website: Property.ShortText({
      displayName: 'Website URL',
      description:
        "Enter the company's website URL (e.g., https://www.example.com)",
      required: false,
    }),
    addresses: addresses,

    iban: Property.ShortText({
      displayName: 'IBAN',
      description: "Enter the company's International Bank Account Number",
      required: false,
    }),
    bic: Property.ShortText({
      displayName: 'BIC Code',
      description: 'Enter the Bank Identifier Code (BIC)',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Primary Language',
      description: "Select the company's primary language for communication",
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Dutch', value: 'nl' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Spanish', value: 'es' },
          { label: 'Italian', value: 'it' },
        ],
      },
    }),
    responsible_user_id: Property.ShortText({
      displayName: 'Account Manager',
      description:
        'Enter the user ID of the person responsible for managing this company',
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Add any internal notes or remarks about this company',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Add tags to categorize and organize this company (e.g., "prospect", "VIP customer")',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          description: 'Enter a tag name',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      name: propsValue.name,
    };

    if (propsValue.business_type_id)
      requestBody['business_type_id'] = propsValue.business_type_id;
    if (propsValue.national_identification_number)
      requestBody['national_identification_number'] =
        propsValue.national_identification_number;

    if (propsValue.vatNumber) requestBody['vat_number'] = propsValue.vatNumber;
    if (propsValue.emails && propsValue.emails.length > 0)
      requestBody['emails'] = propsValue.emails;
    if (propsValue.telephones && propsValue.telephones.length > 0)
      requestBody['telephones'] = propsValue.telephones;
    if (propsValue.website) requestBody['website'] = propsValue.website;
    if (propsValue.language) requestBody['language'] = propsValue.language;
    if (propsValue.iban) requestBody['iban'] = propsValue.iban;
    if (propsValue.bic) requestBody['bic'] = propsValue.bic;
    if (propsValue.responsible_user_id)
      requestBody['responsible_user_id'] = propsValue.responsible_user_id;
    if (propsValue.remarks) requestBody['remarks'] = propsValue.remarks;
    if (propsValue.tags && propsValue.tags.length > 0) {
      requestBody['tags'] = propsValue.tags.map((tag: any) => tag.tag);
    }

    if (propsValue.addresses && propsValue.addresses.length > 0) {
      requestBody['addresses'] = propsValue.addresses.map((addr: any) => ({
        type: addr.type,
        address: {
          ...(addr.addressee && { addressee: addr.addressee }),
          line_1: addr.line_1,
          ...(addr.line_2 && { line_2: addr.line_2 }),
          postal_code: addr.postal_code,
          city: addr.city,
          country: addr.country,
          ...(addr.area_level_two_id && {
            area_level_two_id: addr.area_level_two_id,
          }),
        },
      }));
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.add',
      requestBody
    );

    return {
      status: 'success',
      message: 'Company created successfully',
      data: response.data,
    };
  },
});
