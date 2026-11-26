import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiCreateDealAction = createAction({
  auth: apolloAuth,
  name: 'ai_create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal',
  description: 'Create a deal.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Apollo deal (opportunity) with a name and optional owner, account, amount (plain decimal like 15000.50), stage and close date (YYYY-MM-DD). Every call creates a new deal, so a retry duplicates it; check List Deals first. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: aiProps.text({ displayName: 'Deal Name', description: 'Name of the deal.', required: true }),
    owner_id: aiProps.optionalId({ displayName: 'Owner User ID', description: 'User ID from List Users (field id).' }),
    account_id: aiProps.optionalId({ displayName: 'Account ID', description: 'Account ID from Search Accounts (field id).' }),
    amount: aiProps.text({ displayName: 'Amount', description: 'Plain decimal without symbols or commas, e.g. 15000.50.', required: false }),
    stage_id: aiProps.optionalId({ displayName: 'Deal Stage ID', description: 'Stage ID from List Deal Stages (field id).' }),
    closed_date: aiProps.text({ displayName: 'Close Date', description: 'Expected close date, YYYY-MM-DD.', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'deal' }),
  },
  outputSchema: apolloOutputSchemas.deal,
  async run({ propsValue, auth }) {
    const body = apolloInputs.compact({
      name: apolloInputs.requireText({ value: propsValue.name, label: 'Deal Name' }),
      owner_id: apolloInputs.optionalText(propsValue.owner_id),
      account_id: apolloInputs.optionalText(propsValue.account_id),
      amount: apolloInputs.decimalAmount({ value: propsValue.amount, label: 'Amount' }),
      opportunity_stage_id: apolloInputs.optionalText(propsValue.stage_id),
      closed_date: apolloInputs.ymdDate({ value: propsValue.closed_date, label: 'Close Date' }),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    const response = await apolloRequests.createDeal({ apiKey: apiKeyOf(auth), body });
    return { deal: apolloMappers.deal(response['opportunity']) };
  },
});
