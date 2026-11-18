import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { freshsalesRecords } from '../common/records';
import { dealOutputSchema } from '../output-schemas';

export const createDeal = createAction({
  auth: freshsalesAuth,
  name: 'create_deal',
  displayName: 'Create Deal',
  description: 'Create a new deal',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new Freshsales deal and returns it with its ID. Name and Amount are required; pipeline, stage, owner and currency take IDs (see List Pipelines and Stages, List Users). Not idempotent: each call creates a new deal.',
    idempotent: false,
  },
  outputSchema: dealOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the deal',
      placeholder: 'Acme renewal 2026',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Deal value',
      required: true,
    }),
    sales_account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the account the deal belongs to',
      placeholder: '16000123456',
      required: false,
    }),
    currency_id: freshsalesProps.currency(),
    deal_pipeline_id: freshsalesProps.dealPipeline(),
    deal_stage_id: freshsalesProps.dealStage(),
    deal_type_id: freshsalesProps.dealType(),
    owner_id: freshsalesProps.owner({ required: false }),
    territory_id: freshsalesProps.territory(),
    lead_source_id: freshsalesProps.leadSource(),
    expected_close: Property.DateTime({
      displayName: 'Expected Close',
      description: 'Expected close date',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Win probability from 0 to 100',
      required: false,
    }),
    custom_fields: freshsalesProps.customFields(),
  },
  async run(context) {
    const deal = freshsalesRecords.buildDealBody({
      name: context.propsValue.name,
      amount: context.propsValue.amount,
      sales_account_id: context.propsValue.sales_account_id,
      currency_id: context.propsValue.currency_id,
      deal_pipeline_id: context.propsValue.deal_pipeline_id,
      deal_stage_id: context.propsValue.deal_stage_id,
      deal_type_id: context.propsValue.deal_type_id,
      owner_id: context.propsValue.owner_id,
      territory_id: context.propsValue.territory_id,
      lead_source_id: context.propsValue.lead_source_id,
      expected_close: context.propsValue.expected_close,
      probability: context.propsValue.probability,
      custom_fields: context.propsValue.custom_fields,
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/deals',
      query: { include: freshsalesRecords.RECORD_INCLUDES.deals },
      body: { deal },
    });
    return freshsalesRecords.shapeDeal(freshsalesClient.unwrap({ body: response, key: 'deal' }));
  },
});
