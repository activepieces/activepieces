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
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'Select the currency for the opportunity value.',
      required: false,
      options: {
        options: [
          { label: 'USD - US Dollar', value: 'USD' },
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'GBP - British Pound', value: 'GBP' },
          { label: 'JPY - Japanese Yen', value: 'JPY' },
          { label: 'AUD - Australian Dollar', value: 'AUD' },
          { label: 'CAD - Canadian Dollar', value: 'CAD' },
          { label: 'CHF - Swiss Franc', value: 'CHF' },
          { label: 'CNY - Chinese Yuan', value: 'CNY' },
          { label: 'INR - Indian Rupee', value: 'INR' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The numerical value of the opportunity. (e.g., 450.50)',
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
