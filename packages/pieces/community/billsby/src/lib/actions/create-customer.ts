import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { billsbyAuth, BillsbyAuthType } from '../auth';
import { billsbyRequest } from '../common/client';

export const createCustomerAction = createAction({
  auth: billsbyAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer in Billsby.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run(context) {
    const { first_name, last_name, email, company_name, phone } = context.propsValue;

    return await billsbyRequest({
      auth: context.auth as BillsbyAuthType,
      method: HttpMethod.POST,
      path: '/customers',
      body: {
        firstName: first_name,
        lastName: last_name,
        email,
        ...(company_name ? { companyName: company_name } : {}),
        ...(phone ? { phone } : {}),
      },
    });
  },
});
