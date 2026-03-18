import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addDealAction = createAction({
  name: 'add_deal',
  auth: outsetaAuth,
  displayName: 'Add Deal',
  description:
    'Create a deal and optionally associate it with an account or a person.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    dealPipelineStageUid: Property.ShortText({
      displayName: 'Pipeline Stage UID',
      required: true,
      description: 'The UID of the pipeline stage for this deal.',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
      description: 'The monetary value of the deal.',
    }),
    assignedToPersonClientIdentifier: Property.ShortText({
      displayName: 'Assigned To (Person Client Identifier)',
      required: false,
      description: 'The client identifier of the person this deal is assigned to.',
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      description: 'The UID of the account to associate with this deal.',
    }),
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: false,
      description: 'The UID of the person to associate with this deal.',
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
      DealPipelineStage: { Uid: context.propsValue.dealPipelineStageUid },
    };

    if (context.propsValue.amount != null) {
      body['Amount'] = context.propsValue.amount;
    }
    if (context.propsValue.assignedToPersonClientIdentifier) {
      body['AssignedToPersonClientIdentifier'] =
        context.propsValue.assignedToPersonClientIdentifier;
    }
    if (context.propsValue.dueDate) {
      body['DueDate'] = context.propsValue.dueDate;
    }
    if (context.propsValue.accountUid) {
      body['Account'] = { Uid: context.propsValue.accountUid };
    }
    if (context.propsValue.personUid) {
      body['DealPeople'] = [
        { Person: { Uid: context.propsValue.personUid } },
      ];
    }

    return await client.post<any>('/api/v1/crm/deals', body);
  },
});
