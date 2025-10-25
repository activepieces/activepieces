import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Lead } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../../index';

export const findLeadAction = createAction({
  auth: zendeskSellAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead by field(s)',
  props: {
    leadId: Property.Number({
      displayName: 'Lead ID',
      description: 'Specific lead ID to retrieve',
      required: true,
    }),
  },
  async run(context) {
    if (context.propsValue.leadId) {
      try {
        const response = await makeZendeskSellRequest<{ data: Lead }>(
          context.auth,
          HttpMethod.GET,
          `/leads/${context.propsValue.leadId}`
        );

        return {
          success: true,
          lead: response.data,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Lead not found',
          count: 0,
        };
      }
    }
  },
});