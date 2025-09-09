import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const createOpportunity = createAction({
  auth: copperAuth,
  name: 'copper_create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Adds a new opportunity in Copper.',
  props: {
    name: Property.ShortText({ displayName: 'Opportunity Name', required: true }),
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
    const body: Record<string, unknown> = {
      name: ctx.propsValue.name,
      details: ctx.propsValue.details,
      monetary_value: ctx.propsValue.monetary_value,
      pipeline_id: ctx.propsValue.pipeline_id,
      pipeline_stage_id: ctx.propsValue.pipeline_stage_id,
      primary_contact_id: ctx.propsValue.primary_contact_id,
      company_id: ctx.propsValue.company_id,
      priority: ctx.propsValue.priority,
      status: ctx.propsValue.status,
      close_date: ctx.propsValue.close_date,
    };

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/opportunities`,
      body,
    });
  },
});
