import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const searchOpportunity = createAction({
  auth: copperAuth,
  name: 'copper_search_opportunity',
  displayName: 'Search for an Opportunity',
  description: 'Lookup an opportunity using search criteria.',
  props: {
    name: Property.ShortText({ displayName: 'Opportunity Name', required: false }),
    pipeline_id: Property.Number({ displayName: 'Pipeline ID', required: false }),
    pipeline_stage_id: Property.Number({ displayName: 'Pipeline Stage ID', required: false }),
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
    company_id: Property.Number({ displayName: 'Company ID', required: false }),
    primary_contact_id: Property.Number({ displayName: 'Primary Contact ID', required: false }),
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
    if (ctx.propsValue.pipeline_id) body.pipeline_id = ctx.propsValue.pipeline_id;
    if (ctx.propsValue.pipeline_stage_id) body.pipeline_stage_id = ctx.propsValue.pipeline_stage_id;
    if (ctx.propsValue.status) body.status = ctx.propsValue.status;
    if (ctx.propsValue.company_id) body.company_id = ctx.propsValue.company_id;
    if (ctx.propsValue.primary_contact_id) body.primary_contact_id = ctx.propsValue.primary_contact_id;

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/opportunities/search`,
      body,
    });
  },
});
