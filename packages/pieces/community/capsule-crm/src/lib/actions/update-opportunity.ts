import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const updateOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_opportunity',
  displayName: 'Update Opportunity',
  description: 'Update fields on an existing opportunity.',
  props: {
    opportunity_id: capsuleCrmProps.opportunity_id(),
    milestone_id: capsuleCrmProps.milestone_id(false), 
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Update the name of the opportunity.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Update the details of the opportunity.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Update the currency of the value (e.g., USD, EUR).',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Update the monetary value of the opportunity.',
      required: false,
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'Update the expected closing date in YYYY-MM-DD format.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const opportunityId = propsValue.opportunity_id as number;

    return await capsuleCrmClient.updateOpportunity(auth, opportunityId, {
      name: propsValue.name,
      description: propsValue.description,
      milestoneId: propsValue.milestone_id as number | undefined,
      currency: propsValue.currency,
      amount: propsValue.amount,
      expectedCloseOn: propsValue.expectedCloseOn,
    });
  },
});
