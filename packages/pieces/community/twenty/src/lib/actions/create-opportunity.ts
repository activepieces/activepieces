import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { createOpportunityOutputSchema } from '../output-schemas';

export const createOpportunityAction = createAction({
  auth: twentyAuth,
  name: 'create_opportunity',
  outputSchema: createOpportunityOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity (deal) in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new opportunity (sales deal) in Twenty CRM. Use when registering a deal to track; only the opportunity name is required, with optional stage, amount, currency, close date, and a company ID to link it to an existing company. Not idempotent: each call inserts a new deal, so repeated calls create duplicates.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Stage',
      description: 'The current stage of the opportunity.',
      required: false,
      options: {
        options: [
          { label: 'Incoming', value: 'INCOMING' },
          { label: 'Qualifying', value: 'QUALIFYING' },
          { label: 'Meeting', value: 'MEETING' },
          { label: 'Proposal', value: 'PROPOSAL' },
          { label: 'Won', value: 'WON' },
          { label: 'Lost', value: 'LOST' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The monetary value of the deal.',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency Code',
      description: 'ISO 4217 currency code (e.g. USD, EUR, GBP).',
      required: false,
      defaultValue: 'USD',
    }),
    closeDate: Property.ShortText({
      displayName: 'Close Date',
      description: 'Expected close date (e.g. 2026-06-30).',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'The ID of the company associated with this opportunity.',
      required: false,
    }),
  },
  async run(context) {
    const { name, stage, amount, currency, closeDate, companyId } = context.propsValue;

    return await twentyApi.createOpportunity({
      auth: context.auth,
      name,
      stage,
      amount,
      currency,
      closeDate,
      companyId,
    });
  },
});
