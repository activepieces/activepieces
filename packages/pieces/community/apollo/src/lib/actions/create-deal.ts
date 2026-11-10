import { Property, createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloMappers, apolloRequests } from '../common/requests';

export const createDealAction = createAction({
  auth: apolloAuth,
  name: 'create_deal',
  classification: 'WRITE',
  displayName: 'Create Deal',
  description: 'Create a deal (opportunity) in Apollo.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a deal in the Apollo CRM with name, amount, close date, and owner, account and stage picked from dropdowns. Every run creates a new deal. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Deal Name', required: true }),
    amount: Property.ShortText({ displayName: 'Amount', description: 'Plain number without currency symbols or commas, e.g. 15000.', required: false }),
    owner_id: apolloProps.owner({ displayName: 'Owner', description: 'Apollo user who owns the deal.', required: false }),
    account_id: apolloProps.account({ required: false, description: 'Account (company) the deal belongs to. Type to search.' }),
    opportunity_stage_id: apolloProps.dealStage({ required: false }),
    closed_date: Property.DateTime({ displayName: 'Expected Close Date', required: false }),
    typed_custom_fields: apolloProps.customFields({ modality: 'deal' }),
  },
  outputSchema: apolloOutputSchemas.humanDeal,
  async run({ propsValue, auth }) {
    const closedDate = apolloInputs.optionalText(propsValue.closed_date);
    const body = apolloInputs.compact({
      name: apolloInputs.requireText({ value: propsValue.name, label: 'Deal Name' }),
      amount: apolloInputs.decimalAmount({ value: propsValue.amount, label: 'Amount' }),
      owner_id: apolloInputs.optionalText(propsValue.owner_id),
      account_id: apolloInputs.optionalText(propsValue.account_id),
      opportunity_stage_id: apolloInputs.optionalText(propsValue.opportunity_stage_id),
      closed_date: closedDate === undefined ? undefined : apolloInputs.ymdDate({ value: closedDate.slice(0, 10), label: 'Expected Close Date' }),
      typed_custom_fields: apolloInputs.customFields(propsValue.typed_custom_fields),
    });
    const response = await apolloRequests.createDeal({ apiKey: apiKeyOf(auth), body });
    return { deal: apolloMappers.deal(response['opportunity']) };
  },
});
