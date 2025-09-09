import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createLead = createAction({
  auth: copperAuth,
  name: 'copper_create_lead',
  displayName: 'Create Lead',
  description: 'Adds a new lead in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', required: false }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    company_name: Property.ShortText({ displayName: 'Company Name', required: false }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    monetary_value: Property.Number({ displayName: 'Monetary Value', required: false }),
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
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      title: ctx.propsValue.title,
      company_name: ctx.propsValue.company_name,
      monetary_value: ctx.propsValue.monetary_value,
      status: ctx.propsValue.status,
    };
    if (ctx.propsValue.email) {
      body.email = { email: ctx.propsValue.email, category: 'work' };
    }
    if (ctx.propsValue.phone_number) {
      body.phone_number = { number: ctx.propsValue.phone_number, category: 'work' };
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/leads`,
      body,
    });
  },
});
