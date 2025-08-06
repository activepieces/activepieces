import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createOpportunity = createAction({
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new opportunity in Sellsy',
  auth: sellsyAuth,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Opportunity title',
      required: true,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Associated company ID',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Opportunity amount',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR)',
      required: false,
    }),
    stage: Property.ShortText({
      displayName: 'Stage',
      description: 'Opportunity stage',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the opportunity',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const opportunityData = {
      title: context.propsValue.title,
      contactId: context.propsValue.contactId,
      companyId: context.propsValue.companyId,
      amount: context.propsValue.amount,
      currency: context.propsValue.currency,
      stage: context.propsValue.stage,
      notes: context.propsValue.notes,
    };

    const response = await makeRequest(
      { access_token },
      HttpMethod.POST,
      '/opportunities',
      opportunityData
    );
    return response;
  },
}); 