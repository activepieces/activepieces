import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const updateCompanyAction = createAction({
  auth: mycaseAuth,
  name: 'update_company',
  displayName: 'Update Company',
  description: 'Updates an existing company',
  props: {
    company_id: Property.ShortText({ displayName: 'Company ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const data: Record<string, unknown> = {};
    if (context.propsValue.name) data.name = context.propsValue.name;
    return await client.updateCompany(context.propsValue.company_id, data);
  },
});

