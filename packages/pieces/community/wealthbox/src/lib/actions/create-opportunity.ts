import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createOpportunity = createAction({
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Opportunity Title',
      description: 'The title of the opportunity',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the opportunity',
      required: false,
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description: 'The stage of the opportunity (e.g., prospecting, qualified, proposal, closed-won, closed-lost)',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The monetary amount of the opportunity',
      required: false,
    }),
    close_date: Property.DateTime({
      displayName: 'Close Date',
      description: 'The expected close date of the opportunity',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact associated with the opportunity',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'The probability of winning the opportunity (0-100)',
      required: false,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const opportunityData: any = {
      title: context.propsValue.title,
      stage: context.propsValue.stage,
    };

    if (context.propsValue.description) {
      opportunityData.description = context.propsValue.description;
    }

    if (context.propsValue.amount) {
      opportunityData.amount = context.propsValue.amount;
    }

    if (context.propsValue.close_date) {
      opportunityData.close_date = context.propsValue.close_date;
    }

    if (context.propsValue.contact_id) {
      opportunityData.contact_id = context.propsValue.contact_id;
    }

    if (context.propsValue.probability) {
      opportunityData.probability = context.propsValue.probability;
    }

    const opportunity = await client.createOpportunity(opportunityData);
    return opportunity;
  },
}); 