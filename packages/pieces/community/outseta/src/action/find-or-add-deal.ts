import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown, pipelineStageDropdown } from '../common/dropdowns';

export const findOrAddDealAction = createAction({
  name: 'find_or_add_deal',
  auth: outsetaAuth,
  displayName: 'Find or Add Deal',
  description:
    'Search for a deal by contact email and pipeline. If not found, create a new one.',
  props: {
    contactEmail: Property.ShortText({
      displayName: 'Contact Email',
      required: true,
      description:
        'Email of the contact associated with the deal. Used to search for existing deals.',
    }),
    pipelineUid: pipelineDropdown(),
    pipelineStageUid: pipelineStageDropdown({
      required: false,
      description: 'Pipeline stage for the deal (only required when creating a new one).',
    }),
    name: Property.ShortText({
      displayName: 'Deal Name',
      required: true,
      description: 'Name of the deal (used when creating a new deal).',
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
      description: 'Deal amount.',
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      required: false,
      description: 'UID of the account to associate with the deal.',
    }),
    assignedToPersonClientIdentifier: Property.ShortText({
      displayName: 'Assigned To (Person Client Identifier)',
      required: false,
      description: 'Client identifier of the person to assign the deal to.',
    }),
  },
  async run(context) {
    if (!context.propsValue.pipelineUid) {
      throw new Error('Pipeline is required.');
    }

    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    // Search for the person by email
    const people = await client.getAllPages<any>(
      `/api/v1/crm/people?Email=${encodeURIComponent(context.propsValue.contactEmail)}`
    );
    const person = people.find(
      (item: any) =>
        item.Email?.toLowerCase() ===
        context.propsValue.contactEmail.toLowerCase()
    );

    // If person found, search for deals in the pipeline
    if (person) {
      // Outseta supports server-side nested filtering on /crm/deals (confirmed
      // by Outseta support). DealPipelineStage.DealPipeline.Uid is a parent
      // entity reference and works server-side.
      const deals = await client.getAllPages<any>(
        `/api/v1/crm/deals?DealPipelineStage.DealPipeline.Uid=${encodeURIComponent(context.propsValue.pipelineUid)}&fields=Uid,Name,Amount,DealPipelineStage.Uid,DealPipelineStage.DealPipeline.Uid,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid`
      );
      const existingDeal = deals.find(
        (deal: any) =>
          deal.DealPipelineStage?.DealPipeline?.Uid ===
            context.propsValue.pipelineUid &&
          (deal.DealPeople?.items ?? deal.DealPeople?.Items ?? deal.DealPeople ?? []).some(
            (dp: any) => dp.Person?.Uid === person.Uid
          )
      );

      if (existingDeal) {
        return { created: false, deal: existingDeal };
      }
    }

    if (!context.propsValue.pipelineStageUid) {
      throw new Error(
        'Pipeline Stage is required to create a new deal. Select a stage to enable the create path.'
      );
    }

    const body: Record<string, unknown> = {
      Name: context.propsValue.name,
      DealPipelineStage: { Uid: context.propsValue.pipelineStageUid },
    };

    if (context.propsValue.amount !== undefined && context.propsValue.amount !== null) {
      body['Amount'] = context.propsValue.amount;
    }
    if (context.propsValue.accountUid) {
      body['Account'] = { Uid: context.propsValue.accountUid };
    }
    if (context.propsValue.assignedToPersonClientIdentifier) {
      body['AssignedToPersonClientIdentifier'] =
        context.propsValue.assignedToPersonClientIdentifier;
    }

    // Associate the person with the deal
    if (person) {
      body['DealPeople'] = [{ Person: { Uid: person.Uid } }];
    } else {
      // Create person association with email
      body['DealPeople'] = [
        { Person: { Email: context.propsValue.contactEmail } },
      ];
    }

    const newDeal = await client.post<any>('/api/v1/crm/deals', body);
    return { created: true, deal: newDeal };
  },
});
