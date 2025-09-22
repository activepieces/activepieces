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
   valueCurrency: Property.StaticDropdown({
      displayName: 'Currency',
      description: 'Select the currency for the opportunity value.',
      required: false,
      options: {
        options: [
          { label: 'USD - US Dollar', value: 'USD' },
          { label: 'EUR - Euro', value: 'EUR' },
          { label: 'GBP - British Pound', value: 'GBP' },
          { label: 'JPY - Japanese Yen', value: 'JPY' },
          { label: 'AUD - Australian Dollar', value: 'AUD' },
          { label: 'CAD - Canadian Dollar', value: 'CAD' },
          { label: 'CHF - Swiss Franc', value: 'CHF' },
          { label: 'CNY - Chinese Yuan', value: 'CNY' },
          { label: 'INR - Indian Rupee', value: 'INR' },
        ],
      },
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
