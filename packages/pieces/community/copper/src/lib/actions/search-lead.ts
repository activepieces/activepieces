import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchLead = createAction({
  auth: copperAuth,
  name: 'copper_search_lead',
  displayName: 'Search for a Lead',
  description: 'Lookup a lead using search criteria.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    company_name: Property.ShortText({ displayName: 'Company Name', required: false }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: false,
      options: async () => ({
        options: [
          { label: 'New', value: 'New' },
          { label: 'Qualified', value: 'Qualified' },
          { label: 'Unqualified', value: 'Unqualified' },
        ],
      }),
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      page_size: ctx.propsValue.page_size || 20,
    };
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.email) body.email = { email: ctx.propsValue.email };
    if (ctx.propsValue.company_name) body.company_name = ctx.propsValue.company_name;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/leads/search`,
      body,
    });
  },
});
