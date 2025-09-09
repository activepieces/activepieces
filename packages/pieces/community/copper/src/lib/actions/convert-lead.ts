import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperRequest } from '../common/http';

export const convertLead = createAction({
  auth: copperAuth,
  name: 'copper_convert_lead',
  displayName: 'Convert Lead',
  description: 'Converts a lead into a person (optionally with company/opportunity).',
  props: {
    lead_id: Property.Number({ displayName: 'Lead ID', required: true }),
    details: Property.LongText({ displayName: 'Conversion Details', required: false }),
    create_opportunity: Property.Checkbox({
      displayName: 'Create Opportunity',
      required: false,
      defaultValue: false,
    }),
    opportunity_name: Property.ShortText({
      displayName: 'Opportunity Name',
      required: false,
    }),
  },
  async run(ctx) {
    const body: Record<string, unknown> = {
      details: ctx.propsValue.details,
    };
    
    if (ctx.propsValue.create_opportunity && ctx.propsValue.opportunity_name) {
      body.create_opportunity = true;
      body.opportunity = {
        name: ctx.propsValue.opportunity_name,
      };
    }

    return await copperRequest({
      auth: ctx.auth,
      method: HttpMethod.POST,
      url: `/leads/${ctx.propsValue.lead_id}/convert`,
      body,
    });
  },
});
