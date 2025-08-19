import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import {
  countryDropdown,
  customCountryInput,
  stateDropdown,
  customStateInput,
  jobTitleDropdown,
  customJobTitleInput,
  industryDropdown,
  customIndustryInput
} from '../common/dynamic-dropdowns';

export const createOrUpdateContact = createAction({
  name: 'createOrUpdateContact',
  displayName: 'Create or Update Contact',
  description: 'Creates a new or update an existing contact.',
  auth: pandadocAuth,
  props: {
    contact_id: Property.Dropdown({
      displayName: 'Contact ID (for Update)',
      description: 'Select a contact to update. Leave empty to create a new contact.',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await pandadocClient.makeRequest<{
            results: Array<{
              id: string;
              first_name: string | null;
              last_name: string | null;
              email: string | null;
            }>;
          }>(auth as string, HttpMethod.GET, '/contacts?count=100');

          const options = response.results.map((contact) => {
            const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed';
            const email = contact.email ? ` <${contact.email}>` : '';
            return {
              label: `${name}${email}`,
              value: contact.id,
            };
          });

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load contacts',
            options: [],
          };
        }
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'An email address of the contact',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact\'s first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact\'s last name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Contact\'s company name',
      required: false,
    }),
    job_title: jobTitleDropdown,
    custom_job_title: customJobTitleInput,
    industry: industryDropdown,
    custom_industry: customIndustryInput,
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'A phone number',
      required: false,
    }),
    country: countryDropdown,
    custom_country: customCountryInput,
    state: stateDropdown,
    custom_state: customStateInput,
    street_address: Property.ShortText({
      displayName: 'Street Address',
      description: 'A street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'A city name',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'A postal code',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {};

    if (propsValue.email !== undefined) body.email = propsValue.email;
    if (propsValue.first_name !== undefined) body.first_name = propsValue.first_name;
    if (propsValue.last_name !== undefined) body.last_name = propsValue.last_name;
    if (propsValue.company !== undefined) body.company = propsValue.company;

    // Handle job title with custom support
    if (propsValue.job_title !== undefined) {
      if (propsValue.job_title === 'custom' && propsValue.custom_job_title) {
        body.job_title = propsValue.custom_job_title;
      } else if (propsValue.job_title !== 'custom') {
        body.job_title = propsValue.job_title;
      }
    }

    // Handle industry with custom support
    if (propsValue.industry !== undefined) {
      if (propsValue.industry === 'custom' && propsValue.custom_industry) {
        body.industry = propsValue.custom_industry;
      } else if (propsValue.industry !== 'custom') {
        body.industry = propsValue.industry;
      }
    }

    if (propsValue.phone !== undefined) body.phone = propsValue.phone;

    // Handle country with custom support
    if (propsValue.country !== undefined) {
      if (propsValue.country === 'custom' && propsValue.custom_country) {
        body.country = propsValue.custom_country;
      } else if (propsValue.country !== 'custom') {
        body.country = propsValue.country;
      }
    }

    // Handle state with custom support
    if (propsValue.state !== undefined) {
      if (propsValue.state === 'custom' && propsValue.custom_state) {
        body.state = propsValue.custom_state;
      } else if (propsValue.state !== 'custom') {
        body.state = propsValue.state;
      }
    }

    if (propsValue.street_address !== undefined) body.street_address = propsValue.street_address;
    if (propsValue.city !== undefined) body.city = propsValue.city;
    if (propsValue.postal_code !== undefined) body.postal_code = propsValue.postal_code;

    if (propsValue.contact_id) {
      return await pandadocClient.makeRequest(
        auth as string,
        HttpMethod.PATCH,
        `/contacts/${propsValue.contact_id}`,
        body
      );
    } else {
      return await pandadocClient.makeRequest(
        auth as string,
        HttpMethod.POST,
        '/contacts',
        body
      );
    }
  },
});
