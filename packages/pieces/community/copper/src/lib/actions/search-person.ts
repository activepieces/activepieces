import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchPerson = createAction({
  auth: copperAuth,
  name: 'copper_search_person',
  displayName: 'Search for a Person',
  description: 'Lookup a person using search criteria.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    company_id: Property.Number({ displayName: 'Company ID', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
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
    
    // Build search criteria
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.email) body.emails = [{ email: ctx.propsValue.email }];
    if (ctx.propsValue.company_id) body.company_id = ctx.propsValue.company_id;
    if (ctx.propsValue.title) body.title = ctx.propsValue.title;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/people/search`,
      body,
    });
  },
});
