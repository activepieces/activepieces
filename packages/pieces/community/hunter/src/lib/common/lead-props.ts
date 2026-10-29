import { Property } from '@activepieces/pieces-framework';

export const leadProps = {
  fields,
  leadsListIds,
  customAttributes,
  requiredEmailFields: fields({ emailRequired: true }),
  optionalEmailFields: fields({ emailRequired: false }),
};

function text({ displayName, description }: { displayName: string; description?: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function fields({ emailRequired }: { emailRequired: boolean }) {
  return {
    email: Property.ShortText({
      displayName: 'Email',
      required: emailRequired,
      description: emailRequired ? 'The email address of the lead.' : 'New email address for the lead. Leave empty to keep it.',
    }),
    first_name: text({ displayName: 'First Name' }),
    last_name: text({ displayName: 'Last Name' }),
    position: text({ displayName: 'Position' }),
    company: text({ displayName: 'Company', description: 'Name of the company the lead works at.' }),
    company_industry: text({ displayName: 'Company Industry', description: 'Sector of the company (e.g. Finance, Technology, Education).' }),
    company_size: text({ displayName: 'Company Size', description: 'Size of the company (e.g. 1-10, 201-500 employees).' }),
    confidence_score: Property.Number({ displayName: 'Confidence Score', required: false, description: 'Probability the email is correct (0-100).' }),
    website: text({ displayName: 'Website', description: 'Domain name of the company.' }),
    country_code: text({ displayName: 'Country Code', description: 'ISO 3166-1 alpha-2 country code, e.g. US.' }),
    linkedin_url: text({ displayName: 'LinkedIn URL' }),
    phone_number: text({ displayName: 'Phone Number' }),
    twitter: text({ displayName: 'Twitter Handle' }),
    notes: text({ displayName: 'Notes', description: 'Personal notes about the lead.' }),
    source: text({ displayName: 'Source', description: 'Where the lead was found.' }),
  };
}

const EMPTY_LEADS_LISTS_NOTE = {
  create: 'Leave empty for the default list.',
  update: 'Leave empty to keep the current lists.',
  upsert: 'Leave empty to use the default list for a new lead and keep the current lists of an existing one.',
};

function leadsListIds({ mode }: { mode: keyof typeof EMPTY_LEADS_LISTS_NOTE }) {
  return Property.Array({
    displayName: 'Leads List IDs',
    required: false,
    description: `Numeric leads list IDs to add the lead to (from List Leads Lists). ${EMPTY_LEADS_LISTS_NOTE[mode]}`,
    defaultValue: [],
  });
}

function customAttributes() {
  return Property.Json({
    displayName: 'Custom Attributes',
    required: false,
    description: 'JSON object of custom attribute slug to value, e.g. { "customer_id": "cus-1234abcd" }.',
  });
}
