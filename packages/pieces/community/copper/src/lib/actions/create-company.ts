import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createCompany = createAction({
  auth: copperAuth,
  name: 'copper_create_company',
  displayName: 'Create Company',
  description: 'Adds a new company in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Company Name', required: true }),
    email_domain: Property.ShortText({ displayName: 'Email Domain', required: false }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
    }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    street: Property.ShortText({ displayName: 'Street Address', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    state: Property.ShortText({ displayName: 'State', required: false }),
    postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      email_domain: ctx.propsValue.email_domain,
      website: ctx.propsValue.website,
    };
    
    if (ctx.propsValue.phone_numbers) {
      body.phone_numbers = (ctx.propsValue.phone_numbers as string[]).map(
        (p) => ({ number: p, category: 'work' })
      );
    }
    
    if (ctx.propsValue.street || ctx.propsValue.city || ctx.propsValue.state || ctx.propsValue.postal_code || ctx.propsValue.country) {
      body.address = {
        street: ctx.propsValue.street,
        city: ctx.propsValue.city,
        state: ctx.propsValue.state,
        postal_code: ctx.propsValue.postal_code,
        country: ctx.propsValue.country,
      };
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/companies`,
      body,
    });
  },
});
