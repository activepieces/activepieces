import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { accountUidDropdown, personUidDropdown } from '../common/dropdowns';

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
      description: 'The name or title of the deal.',
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
      displayName: 'Assigned To (Client Identifier)',
      required: false,
      description: "The client identifier of the team member this deal is assigned to. Found in the person's Outseta profile.",
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    accountUid: accountUidDropdown({ required: false, displayName: 'Account' }),
    personUid: personUidDropdown({ required: false, displayName: 'Person' }),
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

    const deal = await client.post<any>('/api/v1/crm/deals', body);

    return deal;
  },
});
