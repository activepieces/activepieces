import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const updateOpportunity = createAction({
  auth: copperAuth,
  name: 'copper_update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity in Copper.',
  props: {
    opportunity_id: Property.Number({ displayName: 'Opportunity ID', required: true }),
    name: Property.ShortText({ displayName: 'Opportunity Name', required: false }),
    monetary_value: Property.Number({ displayName: 'Monetary Value', required: false }),
    pipeline_id: Property.Number({ displayName: 'Pipeline ID', required: false }),
    pipeline_stage_id: Property.Number({ displayName: 'Pipeline Stage ID', required: false }),
    primary_contact_id: Property.Number({ displayName: 'Primary Contact ID', required: false }),
    company_id: Property.Number({ displayName: 'Company ID', required: false }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      required: false,
      options: async () => ({
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      }),
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: false,
      options: async () => ({
        options: [
          { label: 'Open', value: 'Open' },
          { label: 'Won', value: 'Won' },
          { label: 'Lost', value: 'Lost' },
          { label: 'Abandoned', value: 'Abandoned' },
        ],
      }),
    }),
    close_date: Property.DateTime({ displayName: 'Close Date', required: false }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {};
    
    if (ctx.propsValue.name) body.name = ctx.propsValue.name;
    if (ctx.propsValue.details) body.details = ctx.propsValue.details;
    if (ctx.propsValue.monetary_value) body.monetary_value = ctx.propsValue.monetary_value;
    if (ctx.propsValue.pipeline_id) body.pipeline_id = ctx.propsValue.pipeline_id;
    if (ctx.propsValue.pipeline_stage_id) body.pipeline_stage_id = ctx.propsValue.pipeline_stage_id;
    if (ctx.propsValue.primary_contact_id) body.primary_contact_id = ctx.propsValue.primary_contact_id;
    if (ctx.propsValue.company_id) body.company_id = ctx.propsValue.company_id;
    if (ctx.propsValue.priority) body.priority = ctx.propsValue.priority;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;
    if (ctx.propsValue.close_date) body.close_date = ctx.propsValue.close_date;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.PUT,
      url: `/opportunities/${ctx.propsValue.opportunity_id}`,
      body,
    });
  },
});
