import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createCompany = createAction({
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company in Sellsy',
  auth: sellsyAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Company email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Company phone number',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'Company address',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Company website',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the company',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const companyData = {
      name: context.propsValue.name,
      email: context.propsValue.email,
      phone: context.propsValue.phone,
      address: context.propsValue.address,
      website: context.propsValue.website,
      notes: context.propsValue.notes,
    };

    const response = await makeRequest(
      { access_token },
      HttpMethod.POST,
      '/companies',
      companyData
    );
    return response;
  },
}); 