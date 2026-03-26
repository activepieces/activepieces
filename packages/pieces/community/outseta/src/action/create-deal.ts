import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown, pipelineStageDropdown } from '../common/dropdowns';

export const createDealAction = createAction({
  name: 'create_deal',
  auth: outsetaAuth,
  displayName: 'Create Deal',
  description: 'Create a new deal in the CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Deal Name',
      required: true,
    }),
    pipelineUid: pipelineDropdown(),
    pipelineStageUid: pipelineStageDropdown({
      description: 'Pipeline stage for the deal.',
    }),
    contactEmail: Property.ShortText({
      displayName: 'Contact Email',
      required: false,
      description: 'Email of the person to associate with this deal.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      description: 'UID of the account to associate with this deal.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {
      Name: context.propsValue.name,
      DealPipelineStage: { Uid: context.propsValue.pipelineStageUid },
    };
    if (context.propsValue.amount != null) body['Amount'] = context.propsValue.amount;
    if (context.propsValue.accountUid) body['Account'] = { Uid: context.propsValue.accountUid };
    if (context.propsValue.contactEmail) {
      body['DealPeople'] = [{ Person: { Email: context.propsValue.contactEmail } }];
    }

    return client.post<unknown>('/api/v1/crm/deals', body);
  },
});
