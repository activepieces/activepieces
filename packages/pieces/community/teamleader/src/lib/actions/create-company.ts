import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  businessTypeIdDropdown,
  countryDropdown,
  emailTypeDropdown,
} from '../common/props';

export const createCompany = createAction({
  auth: teamleaderAuth,
  name: 'createCompany',
  displayName: 'Create Company',
  description: 'Create a new company in Teamleader',
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the company',
      required: true,
    }),
    country: countryDropdown,
    business_type_id: businessTypeIdDropdown,
    vatNumber: Property.ShortText({
      displayName: 'VAT Number',
      description: 'The VAT number of the company',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses for the company',
      required: false,
      properties: {
        type: emailTypeDropdown,
        email: Property.ShortText({
          displayName: 'Email Address',
          description: 'The email address',
          required: true,
        }),
      },
    }),
    telephones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the company',
      required: false,
      properties: {
        type: emailTypeDropdown,
        number: Property.ShortText({
          displayName: 'Phone Number',
          description: 'The phone number',
          required: true,
        }),
      },
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The website URL of the company',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The language code (e.g., en, nl, fr, de)',
      required: false,
    }),
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: 'The IBAN of the company',
      required: false,
    }),
    bic: Property.ShortText({
      displayName: 'BIC',
      description: 'The BIC of the company',
      required: false,
    }),
    responsible_user_id: Property.ShortText({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for this company',
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Remarks',
      description: 'Any additional remarks about the company',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to categorize the company',
      required: false,
    }),
    marketing_mails_consent: Property.Checkbox({
      displayName: 'Marketing Mails Consent',
      description: 'Consent to receive marketing emails',
      required: false,
      defaultValue: false,
    }),
    preferred_currency: Property.StaticDropdown({
      displayName: 'Preferred Currency',
      description: 'The preferred currency for the company',
      required: false,
      options: {
        options: [
          { label: 'EUR', value: 'EUR' },
          { label: 'USD', value: 'USD' },
          { label: 'GBP', value: 'GBP' },
          { label: 'CHF', value: 'CHF' },
          { label: 'AUD', value: 'AUD' },
          { label: 'CAD', value: 'CAD' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody = {
      name: propsValue.name,
      business_type_id: propsValue.business_type_id,
      vat_number: propsValue.vatNumber,
      emails: propsValue.emails,
      telephones: propsValue.telephones,
      website: propsValue.website,
      language: propsValue.language,
      iban: propsValue.iban,
      bic: propsValue.bic,
      responsible_user_id: propsValue.responsible_user_id,
      remarks: propsValue.remarks,
      tags: propsValue.tags,
      marketing_mails_consent: propsValue.marketing_mails_consent,
      preferred_currency: propsValue.preferred_currency,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.add',
      requestBody
    );

    return response;
  },
});
