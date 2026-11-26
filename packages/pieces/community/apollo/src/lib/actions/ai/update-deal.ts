import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiUpdateDealAction = createAction({
  auth: apolloAuth,
  name: 'ai_update_deal',
  classification: 'WRITE',
  displayName: 'Update Deal',
  description: 'Change fields on a deal.',
  audience: 'ai',
  aiMetadata: {
    description: 'Updates one Apollo deal by deal ID; only the fields you give are sent (name, owner, amount as plain decimal, stage, close date YYYY-MM-DD, custom fields). Move a deal to another stage with stage_id. Uses no credits.',
    idempotent: true,
  },
  props: {
    deal_id: aiProps.id({ displayName: 'Deal ID', description: 'Deal ID from List Deals (field id).' }),
    name: aiProps.text({ displayName: 'Deal Name', description: 'New name.', required: false }),
    owner_id: aiProps.optionalId({ displayName: 'Owner User ID', description: 'User ID from List Users (field id).' }),
    amount: aiProps.text({ displayName: 'Amount', description: 'Plain decimal without symbols or commas, e.g. 15000.50.', required: false }),
    stage_id: aiProps.optionalId({ displayName: 'Deal Stage ID', description: 'Stage ID from List Deal Stages (field id).' }),
    closed_date: aiProps.text({ displayName: 'Close Date', description: 'Expected close date, YYYY-MM-DD.', required: false }),
    typed_custom_fields: aiProps.typedCustomFields({ modality: 'deal' }),
  },
  outputSchema: apolloOutputSchemas.deal,
  async run({ propsValue, auth }) {
    const dealId = apolloInputs.requireText({ value: propsValue.deal_id, label: 'Deal ID' });
    const body = apolloInputs.compact({
      name: apolloInputs.optionalText(propsValue.name),
      owner_id: apolloInputs.optionalText(propsValue.owner_id),
      amount: apolloInputs.decimalAmount({ value: propsValue.amount, label: 'Amount' }),
      opportunity_stage_id: apolloInputs.optionalText(propsValue.stage_id),
      closed_date: apolloInputs.ymdDate({ value: propsValue.closed_date, label: 'Close Date' }),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to change.');
    }
    const response = await apolloRequests.updateDeal({ apiKey: apiKeyOf(auth), dealId, body });
    return { deal: apolloMappers.deal(response['opportunity']) };
  },
});
