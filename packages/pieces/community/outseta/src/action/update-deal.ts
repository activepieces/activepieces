import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updateDealAction = createAction({
  name: 'update_deal',
  auth: outsetaAuth,
  displayName: 'Update Deal',
  description: 'Update an existing deal.',
  props: {
    dealUid: Property.ShortText({
      displayName: 'Deal UID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Deal Name',
      required: false,
    }),
    dealPipelineStageUid: Property.ShortText({
      displayName: 'Pipeline Stage UID',
      required: false,
      description: 'The UID of the new pipeline stage.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
      description: 'The monetary value of the deal.',
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      description: 'The UID of the account to associate with this deal.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Fetch the full deal first to avoid wiping fields with a partial PUT
    const deal = await client.get<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`
    );

    if (context.propsValue.name) {
      deal.Name = context.propsValue.name;
    }
    if (context.propsValue.dealPipelineStageUid) {
      deal.DealPipelineStage = { Uid: context.propsValue.dealPipelineStageUid };
    }
    if (context.propsValue.amount != null) {
      deal.Amount = context.propsValue.amount;
    }
    if (context.propsValue.accountUid) {
      deal.Account = { Uid: context.propsValue.accountUid };
    }

    return await client.put<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`,
      deal
    );
  },
});
