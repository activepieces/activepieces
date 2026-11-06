import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import {
  contactUpdateDropdown,
  countryDropdown,
  customCountryInput,
  stateDropdown,
  customStateInput,
  jobTitleDropdown,
  customJobTitleInput,
  industryDropdown,
  customIndustryInput,
} from '../common/dynamic-dropdowns';

export const createOrUpdateContact = createAction({
  auth: pandadocAuth,
  name: 'createOrUpdateContact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Creates a new or update an existing contact.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a PandaDoc contact, or update the selected one. Not idempotent in create mode: each call without a contact creates another one.',
    idempotent: false,
  },
  props: {
    contact_id: contactUpdateDropdown,
    email: Property.ShortText({ displayName: 'Email', description: 'An email address of the contact', required: false }),
    first_name: Property.ShortText({ displayName: 'First Name', description: "Contact's first name", required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', description: "Contact's last name", required: false }),
    company: Property.ShortText({ displayName: 'Company', description: "Contact's company name", required: false }),
    job_title: jobTitleDropdown,
    custom_job_title: customJobTitleInput,
    industry: industryDropdown,
    custom_industry: customIndustryInput,
    phone: Property.ShortText({ displayName: 'Phone', description: 'A phone number', required: false }),
    country: countryDropdown,
    custom_country: customCountryInput,
    state: stateDropdown,
    custom_state: customStateInput,
    street_address: Property.ShortText({ displayName: 'Street Address', description: 'A street address', required: false }),
    city: Property.ShortText({ displayName: 'City', description: 'A city name', required: false }),
    postal_code: Property.ShortText({ displayName: 'Postal Code', description: 'A postal code', required: false }),
  },
  outputSchema: pandadocSchemas['rawContact'],
  async run({ auth, propsValue }) {
    const values: Record<string, string | undefined> = {
      email: clearableText(propsValue.email),
      first_name: clearableText(propsValue.first_name),
      last_name: clearableText(propsValue.last_name),
      company: clearableText(propsValue.company),
      job_title: pandadocInputs.pickCustom({ value: propsValue.job_title, custom: propsValue.custom_job_title }),
      industry: pandadocInputs.pickCustom({ value: propsValue.industry, custom: propsValue.custom_industry }),
      phone: clearableText(propsValue.phone),
      country: pandadocInputs.pickCustom({ value: propsValue.country, custom: propsValue.custom_country }),
      state: pandadocInputs.pickCustom({ value: propsValue.state, custom: propsValue.custom_state }),
      street_address: clearableText(propsValue.street_address),
      city: clearableText(propsValue.city),
      postal_code: clearableText(propsValue.postal_code),
    };
    const body = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
    const contactId = pandadocInputs.optionalString(propsValue.contact_id);
    if (contactId !== undefined) {
      return pandadocApi.updateContactRaw({ apiKey: auth.secret_text, contactId, body });
    }
    return pandadocApi.createContactRaw({ apiKey: auth.secret_text, body });
  },
});

function clearableText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : pandadocInputs.optionalString(value);
}
