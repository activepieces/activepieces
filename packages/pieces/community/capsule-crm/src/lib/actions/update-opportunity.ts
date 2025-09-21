import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const updateOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Update an existing opportunity in Capsule CRM',
  
  props: {
    opportunityId: capsuleProps.opportunityId,
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      required: false,
    }),
    value: Property.Number({
      displayName: 'Value',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },

  async run(context) {
    const { opportunityId, name, value, description } = context.propsValue;

    const opportunity: any = {};
    
    if (name) opportunity.name = name;
    if (value !== undefined) opportunity.value = { amount: value, currency: 'USD' };
    if (description) opportunity.description = description;

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.PUT,
      `/opportunities/${opportunityId}`,
      { opportunity }
    );

    return response.opportunity;
  },
});
