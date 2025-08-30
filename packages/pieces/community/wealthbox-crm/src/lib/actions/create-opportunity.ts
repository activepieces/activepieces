import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const createOpportunityAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Logs an opportunity including stage, close date, and amount',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      required: true,
    }),
    contact_id: wealthboxCommon.contactId,
    stage: wealthboxCommon.opportunityStage,
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    close_date: Property.DateTime({
      displayName: 'Close Date',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
  },
  async run(context) {
    const { name, contact_id, stage, amount, close_date, description, tags } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const opportunityData: any = {
      name,
      contact_id,
    };

    if (stage) opportunityData.stage = stage;
    if (amount) opportunityData.amount = amount;
    if (close_date) opportunityData.close_date = close_date;
    if (description) opportunityData.description = description;
    if (tags && tags.length > 0) opportunityData.tags = tags;

    const result = await client.createOpportunity(opportunityData);
    
    return result;
  },
});
