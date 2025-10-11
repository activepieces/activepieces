import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createOpportunity = createAction({
  auth: salesforceAuth,
  name: 'create_opportunity',
  displayName: 'Create Opportunity',
  description: 'Creates a new Opportunity in Salesforce',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the opportunity',
      required: true,
    }),
    closeDate: Property.ShortText({
      displayName: 'Close Date',
      description: 'Expected close date (YYYY-MM-DD format)',
      required: true,
    }),
    stageName: Property.ShortText({
      displayName: 'Stage Name',
      description: 'Current stage of the opportunity (e.g., Prospecting, Qualification, Closed Won)',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the related Account',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Opportunity amount in currency',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Probability of closing (0-100)',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Type of opportunity (e.g., New Customer, Existing Customer)',
      required: false,
    }),
    leadSource: Property.ShortText({
      displayName: 'Lead Source',
      description: 'Source of the opportunity',
      required: false,
    }),
    nextStep: Property.ShortText({
      displayName: 'Next Step',
      description: 'Description of next step in opportunity process',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the opportunity',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional custom fields as JSON object',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      name,
      closeDate,
      stageName,
      accountId,
      amount,
      probability,
      type,
      leadSource,
      nextStep,
      description,
      additionalFields,
    } = context.propsValue;

    const opportunityData: Record<string, unknown> = {
      Name: name,
      CloseDate: closeDate,
      StageName: stageName,
      ...(accountId && { AccountId: accountId }),
      ...(amount !== undefined && amount !== null && { Amount: amount }),
      ...(probability !== undefined && probability !== null && { Probability: probability }),
      ...(type && { Type: type }),
      ...(leadSource && { LeadSource: leadSource }),
      ...(nextStep && { NextStep: nextStep }),
      ...(description && { Description: description }),
      ...additionalFields,
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/Opportunity',
      opportunityData
    );
    return response.body;
  },
});

