import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { capsuleCrmProps } from '../common/props';

export const createOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new opportunity for a contact.',
  props: {
    party_id: capsuleCrmProps.contact_id(),
    milestone_id: capsuleCrmProps.milestone_id(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A short description of the opportunity.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'More details about the opportunity.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The currency of the opportunity value (e.g., USD, EUR).',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The monetary value of the opportunity.',
      required: false,
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'The expected closing date in YYYY-MM-DD format.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    return await capsuleCrmClient.createOpportunity(auth, {
      partyId: propsValue.party_id as number,
      milestoneId: propsValue.milestone_id as number,
      name: propsValue.name,
      description: propsValue.description,
      currency: propsValue.currency,
      amount: propsValue.amount,
      expectedCloseOn: propsValue.expectedCloseOn,
    });
  },
});
