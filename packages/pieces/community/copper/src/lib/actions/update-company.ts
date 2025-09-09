import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCompany = createAction({
  auth: copperAuth,
  name: 'copper_update_company',
  displayName: 'Update Company',
  description: 'Update an existing company in Copper',
  props: {
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company',
      required: false,
    }),
    address: Property.Json({
      displayName: 'Address',
      description: 'Company address as JSON object with street, city, state, postal_code, country',
      required: false,
    }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the company',
      required: false,
      properties: {
        number: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
        category: Property.StaticDropdown({
          displayName: 'Category',
          required: false,
          defaultValue: 'work',
          options: {
            options: [
              { label: 'Work', value: 'work' },
              { label: 'Fax', value: 'fax' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website URL',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the company',
      required: false,
    }),
    email_domain: Property.ShortText({
      displayName: 'Email Domain',
      description: 'Primary email domain for the company',
      required: false,
    }),
  },
  async run(context) {
    const { company_id, name, address, phone_numbers, website, details, email_domain } = context.propsValue;

    const body: any = {};

    if (name) body.name = name;
    if (address) body.address = address;
    if (phone_numbers && phone_numbers.length > 0) body.phone_numbers = phone_numbers;
    if (website) body.website = website;
    if (details) body.details = details;
    if (email_domain) body.email_domain = email_domain;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      url: `/companies/${company_id}`,
      body,
    });

    return response;
  },
});
