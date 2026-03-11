import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest } from '../common';

export const createOpportunity = createAction({
  auth: twentyAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity (deal) in Twenty CRM.',
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

    return await twentyRequest(
      context.auth,
      HttpMethod.POST,
      '/rest/opportunities',
      {
        name,
        stage: stage ?? undefined,
        amount: amount != null ? { amountMicros: Math.round(amount * 1_000_000), currencyCode: currency ?? 'USD' } : undefined,
        closeDate: closeDate ?? undefined,
        companyId: companyId ?? undefined,
      },
    );
  },
});
