import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createPerson = createAction({
  auth: copperAuth,
  name: 'copper_create_person',
  displayName: 'Create Person',
  description: 'Adds a new person/contact in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
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
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      title: ctx.propsValue.title,
      company_id: ctx.propsValue.company_id,
    };
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
      method: HttpMethod.POST,
      url: `/people`,
      body,
    });
  },
});

