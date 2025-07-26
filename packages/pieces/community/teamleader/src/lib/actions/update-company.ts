import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  addresses,
  businessTypeIdDropdown,
  companiesIdDropdown,
  currencyDropdown,
  emailTypeDropdown,
  phoneTypeDropdown,
} from '../common/props';

export const updateCompany = createAction({
  auth: teamleaderAuth,
  name: 'updateCompany',
  displayName: 'Update Company',
  description:
    'Update an existing company record in Teamleader with new information',
  props: {
    company_id: companiesIdDropdown,
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Enter the new official name of the company',
      required: false,
    }),
    business_type_id: businessTypeIdDropdown,
    vat_number: Property.ShortText({
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
      description: 'Update or add email addresses for the company',
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
      description: 'Update or add phone numbers for the company',
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
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: "Enter the company's International Bank Account Number",
      required: false,
    }),
    bic: Property.ShortText({
      displayName: 'BIC/SWIFT Code',
      description: 'Enter the Bank Identifier Code (BIC) or SWIFT code',
      required: false,
    }),
    preferred_currency: currencyDropdown,
    remarks: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Add or update internal notes or remarks about this company',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Add or update tags to categorize and organize this company (e.g., "prospect", "VIP customer")',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          description: 'Enter a tag name',
          required: true,
        }),
      },
    }),

    marketing_mails_consent: Property.Checkbox({
      displayName: 'Marketing Email Consent',
      description: 'Update consent status for marketing emails',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      id: propsValue.company_id,
    };

    // Only include fields that are provided
    if (propsValue.name) requestBody['name'] = propsValue.name;
    if (propsValue.business_type_id)
      requestBody['business_type_id'] = propsValue.business_type_id;
    if (propsValue.vat_number)
      requestBody['vat_number'] = propsValue.vat_number;
    if (propsValue.national_identification_number) {
      requestBody['national_identification_number'] =
        propsValue.national_identification_number;
    }
    if (propsValue.emails && propsValue.emails.length > 0)
      requestBody['emails'] = propsValue.emails;
    if (propsValue.telephones && propsValue.telephones.length > 0)
      requestBody['telephones'] = propsValue.telephones;
    if (propsValue.website) requestBody['website'] = propsValue.website;
    if (propsValue.language) requestBody['language'] = propsValue.language;
    if (propsValue.iban) requestBody['iban'] = propsValue.iban;
    if (propsValue.bic) requestBody['bic'] = propsValue.bic;
    if (propsValue.preferred_currency)
      requestBody['preferred_currency'] = propsValue.preferred_currency;
    if (propsValue.remarks) requestBody['remarks'] = propsValue.remarks;
    if (propsValue.responsible_user_id)
      requestBody['responsible_user_id'] = propsValue.responsible_user_id;
    if (typeof propsValue.marketing_mails_consent !== 'undefined') {
      requestBody['marketing_mails_consent'] =
        propsValue.marketing_mails_consent;
    }

    // Handle tags array
    if (propsValue.tags && propsValue.tags.length > 0) {
      requestBody['tags'] = propsValue.tags.map((tag: any) => tag.tag);
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.update',
      requestBody
    );

    return {
      status: 'success',
      message: 'Company updated successfully',
      data: response.data,
    };
  },
});
