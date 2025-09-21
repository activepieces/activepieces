import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { milestoneDropdown, partyIdDropdown } from '../common/dropdown';


export const createOpportunity = createAction({
  auth: CapsuleCRMAuth,
  name: 'createOpportunity',
  displayName: 'Create Opportunity',
  description: 'Create a new Opportunity in Capsule CRM',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      required: true,
    }),
    partyId: partyIdDropdown,
    milestoneId: milestoneDropdown,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    valueAmount: Property.Number({
      displayName: 'Value Amount',
      required: false,
    }),
    valueCurrency: Property.ShortText({
      displayName: 'Currency',
      description: 'Currency code (e.g. USD, EUR, INR)',
      required: false,
    }),
    expectedCloseOn: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'Format: YYYY-MM-DD',
      required: false,
    }),

    tags: Property.ShortText({
      displayName: 'Tags (comma separated)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      opportunity: {
        name: propsValue.name,
        party: { id: propsValue.partyId },
      },
    };

    if (propsValue.milestoneId) {
      body.opportunity.milestone = { id: propsValue.milestoneId };
    }
    if (propsValue.description) {
      body.opportunity.description = propsValue.description;
    }
    if (propsValue.valueAmount && propsValue.valueCurrency) {
      body.opportunity.value = {
        amount: propsValue.valueAmount,
        currency: propsValue.valueCurrency,
      };
    }
    if (propsValue.expectedCloseOn) {
      body.opportunity.expectedCloseOn = propsValue.expectedCloseOn;
    }

    if (propsValue.tags) {
      body.opportunity.tags = propsValue.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/opportunities',
      body
    );

    return response;
  },
});
