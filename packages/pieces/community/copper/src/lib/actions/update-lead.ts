import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const updateLead = createAction({
  auth: copperAuth,
  name: 'copper_update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead in Copper.',
  props: {
    lead_id: Property.Number({ displayName: 'Lead ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
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
    const body: Record<string, unknown> = {};
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.details) body.details = ctx.propsValue.details;
    if (ctx.propsValue.title) body.title = ctx.propsValue.title;
    if (ctx.propsValue.company_name) body.company_name = ctx.propsValue.company_name;
    if (ctx.propsValue.monetary_value) body.monetary_value = ctx.propsValue.monetary_value;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;
    if (ctx.propsValue.email) {
      body.email = { email: ctx.propsValue.email, category: 'work' };
    }
    if (ctx.propsValue.phone_number) {
      body.phone_number = { number: ctx.propsValue.phone_number, category: 'work' };
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.PUT,
      url: `/leads/${ctx.propsValue.lead_id}`,
      body,
    });
  },
});
