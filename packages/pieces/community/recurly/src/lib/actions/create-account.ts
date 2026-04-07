import { createAction, Property } from '@activepieces/pieces-framework';
import { AccountCreate } from 'recurly';
import { recurlyAuth } from '../auth';
import {
  createRecurlyClient,
  flattenRecurlyResource,
} from '../common/client';

export const createAccountAction = createAction({
  auth: recurlyAuth,
  name: 'create_account',
  displayName: 'Create Account',
  description: 'Create a billing account in Recurly.',
  props: {
    code: Property.ShortText({
      displayName: 'Account Code',
      description: 'A unique account code for this customer, for example acme-123.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The primary email address for the billing account.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The customer’s first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The customer’s last name.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name for this billing account.',
      required: false,
    }),
  },
  async run(context) {
    const requestBody: AccountCreate = {
      code: context.propsValue.code,
      email: context.propsValue.email,
      firstName: context.propsValue.firstName ?? null,
      lastName: context.propsValue.lastName ?? null,
      company: context.propsValue.company ?? null,
    };

    const account = await createRecurlyClient(context.auth).createAccount(requestBody);
    return flattenRecurlyResource(account);
  },
});
