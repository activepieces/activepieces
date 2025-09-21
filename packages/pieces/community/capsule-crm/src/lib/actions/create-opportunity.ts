import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const createOpportunityAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new opportunity in Capsule CRM',
  
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name of the opportunity',
      required: true,
    }),
    partyId: capsuleProps.contactId,
    value: Property.Number({
      displayName: 'Value',
      description: 'Monetary value of the opportunity',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g., USD, EUR, GBP)',
      required: false,
      defaultValue: 'USD',
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the opportunity',
      required: false,
    }),
    expectedCloseDate: Property.DateTime({
      displayName: 'Expected Close Date',
      description: 'Expected date to close the opportunity',
      required: false,
    }),
  },

  async run(context) {
    const { name, partyId, value, currency, description, expectedCloseDate } = context.propsValue;

    const opportunity: any = {
      name,
      party: {
        id: partyId,
      },
    };

    if (value !== undefined) {
      opportunity.value = {
        amount: value,
        currency: currency || 'USD',
      };
    }

    if (description) opportunity.description = description;
    if (expectedCloseDate) opportunity.expectedCloseDate = expectedCloseDate;

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/opportunities',
      { opportunity }
    );

    return response.opportunity;
  },
});
