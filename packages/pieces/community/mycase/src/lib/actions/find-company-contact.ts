import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const findCompanyContactAction = createAction({
  auth: mycaseAuth,
  name: 'find_company_contact',
  displayName: 'Find Company Contact',
  description: 'Finds a company',
  props: {
    search: Property.ShortText({ displayName: 'Search Query', required: true }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.findCompanyContact({ search: context.propsValue.search });
  },
});

