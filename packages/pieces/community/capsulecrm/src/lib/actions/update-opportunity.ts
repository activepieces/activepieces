import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { opportunityIdDropdown, milestoneDropdown, partyIdDropdown } from '../common/dropdown';

export const updateOpportunity = createAction({
  auth: CapsuleCRMAuth,
  name: 'updateOpportunity',
  displayName: 'Update Opportunity',
  description: 'Update an existing Opportunity in Capsule CRM',
  props: {
    opportunityId: opportunityIdDropdown,
    title: Property.ShortText({
      displayName: 'Opportunity Title',
      required: false,
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
      description: 'Currency code (e.g., USD, EUR, INR)',
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
        id: propsValue.opportunityId,
        ...(propsValue.title && { name: propsValue.title }),
        ...(propsValue.partyId && { party: { id: propsValue.partyId } }),
        ...(propsValue.milestoneId && { milestone: { id: propsValue.milestoneId } }),
        ...(propsValue.description && { description: propsValue.description }),
        ...(propsValue.valueAmount && propsValue.valueCurrency && {
          value: {
            amount: propsValue.valueAmount,
            currency: propsValue.valueCurrency,
          },
        }),

        ...(propsValue.tags && {
          tags: propsValue.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean),
        }),
      },
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.PUT,
      `/opportunities/${propsValue.opportunityId}`,
      body
    );

    return response;
  },
});
