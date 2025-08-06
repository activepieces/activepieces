import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const updateOpportunity = createAction({
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity in Sellsy',
  auth: sellsyAuth,
  props: {
    opportunityId: Property.ShortText({
      displayName: 'Opportunity ID',
      description: 'The ID of the opportunity to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Opportunity title',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Opportunity amount',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR)',
      required: false,
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description: 'Opportunity stage',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the opportunity',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const opportunityData: any = {};
    if (context.propsValue.title) opportunityData.title = context.propsValue.title;
    if (context.propsValue.amount) opportunityData.amount = context.propsValue.amount;
    if (context.propsValue.currency) opportunityData.currency = context.propsValue.currency;
    if (context.propsValue.stage) opportunityData.stage = context.propsValue.stage;
    if (context.propsValue.notes) opportunityData.notes = context.propsValue.notes;

    const response = await makeRequest(
      { access_token },
      HttpMethod.PUT,
      `/opportunities/${context.propsValue.opportunityId}`,
      opportunityData
    );
    return response;
  },
}); 