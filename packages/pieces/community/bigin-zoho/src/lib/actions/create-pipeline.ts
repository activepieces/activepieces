import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginPipeline } from '../common';

export const createPipeline = createAction({
  auth: biginZohoAuth,
  name: 'bigin_create_pipeline',
  displayName: 'Create Pipeline Record',
  description: 'Creates a new deal/pipeline record in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal/pipeline record',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Stage',
      required: false,
      options: {
        options: [
          { label: 'Qualification', value: 'Qualification' },
          { label: 'Needs Analysis', value: 'Needs Analysis' },
          { label: 'Value Proposition', value: 'Value Proposition' },
          { label: 'Identify Decision Makers', value: 'Identify Decision Makers' },
          { label: 'Proposal/Price Quote', value: 'Proposal/Price Quote' },
          { label: 'Negotiation/Review', value: 'Negotiation/Review' },
          { label: 'Closed Won', value: 'Closed Won' },
          { label: 'Closed Lost', value: 'Closed Lost' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Deal amount',
      required: false,
    }),
    closingDate: Property.ShortText({
      displayName: 'Closing Date',
      description: 'Expected closing date (YYYY-MM-DD format)',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Probability of closing (0-100)',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Existing Customer - Upgrade', value: 'Existing Customer - Upgrade' },
          { label: 'Existing Customer - Replacement', value: 'Existing Customer - Replacement' },
          { label: 'Existing Customer - Downgrade', value: 'Existing Customer - Downgrade' },
          { label: 'New Customer', value: 'New Customer' },
        ],
      },
    }),
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'Related company/account name',
      required: false,
    }),
    contactName: Property.ShortText({
      displayName: 'Contact Name',
      description: 'Related contact name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const {
      dealName,
      stage,
      amount,
      closingDate,
      probability,
      type,
      accountName,
      contactName,
      description,
    } = context.propsValue;

    const pipelineData: Partial<BiginPipeline> = {
      Deal_Name: dealName,
    };

    // Add optional fields if provided
    if (stage) pipelineData.Stage = stage;
    if (amount) pipelineData.Amount = amount;
    if (closingDate) pipelineData.Closing_Date = closingDate;
    if (probability) pipelineData.Probability = probability;
    if (type) pipelineData.Type = type;
    if (accountName) {
      pipelineData.Account_Name = { name: accountName };
    }
    if (contactName) {
      pipelineData.Contact_Name = { name: contactName };
    }
    if (description) pipelineData.Description = description;

    const requestBody = {
      data: [pipelineData],
    };

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/Deals',
      requestBody
    );

    return response;
  },
}); 