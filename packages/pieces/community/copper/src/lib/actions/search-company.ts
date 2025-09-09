import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchCompany = createAction({
  auth: copperAuth,
  name: 'copper_search_company',
  displayName: 'Search for a Company',
  description: 'Lookup a company using search criteria.',
  props: {
    name: Property.ShortText({ displayName: 'Company Name', required: false }),
    email_domain: Property.ShortText({ displayName: 'Email Domain', required: false }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
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
    if (ctx.propsValue.email_domain) body.email_domain = ctx.propsValue.email_domain;
    if (ctx.propsValue.website) body.website = ctx.propsValue.website;
    if (ctx.propsValue.city || ctx.propsValue.state || ctx.propsValue.country) {
      body.address = {
        city: ctx.propsValue.city,
        state: ctx.propsValue.state,
        country: ctx.propsValue.country,
      };
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/companies/search`,
      body,
    });
  },
});
