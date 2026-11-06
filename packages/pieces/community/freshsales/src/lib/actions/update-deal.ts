import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { freshsalesRecords } from '../common/records';
import { dealOutputSchema } from '../output-schemas';

export const updateDeal = createAction({
  auth: freshsalesAuth,
  name: 'update_deal',
  displayName: 'Update Deal',
  description: 'Update a deal or move it to another stage',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an existing Freshsales deal by numeric ID, including moving it to another stage. Only the fields you provide are changed. Returns the updated deal. Idempotent: repeating the call with the same values gives the same result.',
    idempotent: true,
  },
  outputSchema: dealOutputSchema,
  props: {
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal to update',
      placeholder: '16000123456',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the deal',
      placeholder: 'Acme renewal 2026',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Deal value',
      required: false,
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
    const id = freshsalesClient.requireId({ value: context.propsValue.deal_id, field: 'Deal ID' });
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
    if (Object.keys(deal).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/deals/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.deals },
      body: { deal },
    });
    return freshsalesRecords.shapeDeal(freshsalesClient.unwrap({ body: response, key: 'deal' }));
  },
});
