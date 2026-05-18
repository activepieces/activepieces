import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { accountUidDropdown, dealUidDropdown, personUidDropdown } from '../common/dropdowns';

export const updateDealAction = createAction({
  name: 'update_deal',
  auth: outsetaAuth,
  displayName: 'Update Deal',
  description: 'Update an existing deal.',
  props: {
    dealUid: dealUidDropdown(),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    dealPipelineStageUid: Property.ShortText({
      displayName: 'Pipeline Stage UID',
      required: false,
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

    // const deal = await client.get<any>(
    //   `/api/v1/crm/deals/${context.propsValue.dealUid}`
    // );
    const deal: any = {};

    if (context.propsValue.name) {
      deal.Name = context.propsValue.name;
    }
    if (context.propsValue.dealPipelineStageUid) {
      deal.DealPipelineStage = { Uid: context.propsValue.dealPipelineStageUid };
    }
    if (context.propsValue.amount != null) {
      deal.Amount = context.propsValue.amount;
    }
    if (context.propsValue.assignedToPersonClientIdentifier) {
      deal.AssignedToPersonClientIdentifier =
        context.propsValue.assignedToPersonClientIdentifier;
    }
    if (context.propsValue.dueDate) {
      deal.DueDate = context.propsValue.dueDate;
    }
    if (context.propsValue.accountUid) {
      deal.Account = { Uid: context.propsValue.accountUid };
    }
    if (context.propsValue.personUid) {
      deal.DealPeople = [
        { Person: { Uid: context.propsValue.personUid } },
      ];
    }

    const updated = await client.put<any>(
      `/api/v1/crm/deals/${context.propsValue.dealUid}`,
      deal
    );

    return {
      uid: updated.Uid ?? null,
      name: updated.Name ?? null,
      amount: updated.Amount ?? null,
      due_date: updated.DueDate ?? null,
      pipeline_stage_uid: updated.DealPipelineStage?.Uid ?? null,
      pipeline_stage_name: updated.DealPipelineStage?.Name ?? null,
      account_uid: updated.Account?.Uid ?? null,
      account_name: updated.Account?.Name ?? null,
      updated: updated.Updated ?? null,
    };
  },
});
