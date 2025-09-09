import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const updatePerson = createAction({
  auth: copperAuth,
  name: 'copper_update_person',
  displayName: 'Update Person',
  description: 'Updates an existing person/contact in Copper.',
  props: {
    person_id: Property.Number({ displayName: 'Person ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
    }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    company_id: Property.Number({ displayName: 'Company ID', required: false }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {};
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.details) body.details = ctx.propsValue.details;
    if (ctx.propsValue.title) body.title = ctx.propsValue.title;
    if (ctx.propsValue.company_id) body.company_id = ctx.propsValue.company_id;
    if (ctx.propsValue.email) {
      body.emails = [{ email: ctx.propsValue.email, category: 'work' }];
    }
    if (ctx.propsValue.phone_numbers) {
      body.phone_numbers = (ctx.propsValue.phone_numbers as string[]).map(
        (p) => ({ number: p, category: 'work' })
      );
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.PUT,
      url: `/people/${ctx.propsValue.person_id}`,
      body,
    });
  },
});
