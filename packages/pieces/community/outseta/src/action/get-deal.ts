import { createAction } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { dealUidDropdown } from '../common/dropdowns';

export const getDealAction = createAction({
  name: 'get_deal',
  auth: outsetaAuth,
  displayName: 'Get Deal',
  description: 'Retrieve a deal by selecting it from the dropdown.',
  props: {
    dealUid: dealUidDropdown(),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const deal = await client.get<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`
    );

    return {
      uid: deal.Uid ?? null,
      name: deal.Name ?? null,
      amount: deal.Amount ?? null,
      due_date: deal.DueDate ?? null,
      pipeline_stage_uid: deal.DealPipelineStage?.Uid ?? null,
      pipeline_stage_name: deal.DealPipelineStage?.Name ?? null,
      account_uid: deal.Account?.Uid ?? null,
      account_name: deal.Account?.Name ?? null,
      assigned_to_client_identifier: deal.AssignedToPersonClientIdentifier ?? null,
      created: deal.Created ?? null,
      updated: deal.Updated ?? null,
    };
  },
});
