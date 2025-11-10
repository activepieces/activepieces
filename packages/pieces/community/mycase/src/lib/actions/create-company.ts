import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createCompanyAction = createAction({
  auth: mycaseAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Creates a new company in MyCase',
  props: {
    name: Property.ShortText({ displayName: 'Company Name', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createCompany({ name: context.propsValue.name });
  },
});
