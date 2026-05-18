import { createAction, Property } from '@activepieces/pieces-framework';
import { loftyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { leadIdDropdown } from '../common/props';

export const createTransaction = createAction({
  auth: loftyAuth,
  name: 'createTransaction',
  displayName: 'Create Transaction',
  description: 'Create a transaction for a Lofty lead',
  props: {
    leadId: leadIdDropdown,
    transactionDate: Property.ShortText({
      displayName: 'Transaction Date',
      description: 'YYYY-MM-DD',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    transactionType: Property.ShortText({
      displayName: 'Transaction Type',
      description: 'e.g., sale, rent',
      required: false,
    }),
    propertyAddress: Property.ShortText({
      displayName: 'Property Address',
      required: false,
    }),
    propertyCity: Property.ShortText({
      displayName: 'Property City',
      required: false,
    }),
    propertyState: Property.ShortText({
      displayName: 'Property State',
      required: false,
    }),
    propertyZipcode: Property.ShortText({
      displayName: 'Property Zipcode',
      required: false,
    }),
    beds: Property.Number({
      displayName: 'Beds',
      required: false,
    }),
    baths: Property.Number({
      displayName: 'Baths',
      required: false,
    }),
    sqft: Property.Number({
      displayName: 'SqFt',
      required: false,
    }),
    mlsNumber: Property.ShortText({
      displayName: 'MLS Number',
      required: false,
    }),
    closingDate: Property.ShortText({
      displayName: 'Closing Date',
      description: 'YYYY-MM-DD',
      required: false,
    }),
    agentId: Property.ShortText({
      displayName: 'Agent ID',
      required: false,
    }),
    agentName: Property.ShortText({
      displayName: 'Agent Name',
      required: false,
    }),
    agentEmail: Property.ShortText({
      displayName: 'Agent Email',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { leadId } = propsValue;

    const payload: any = {};

    if (propsValue.transactionDate) payload.transaction_date = propsValue.transactionDate;
    if (propsValue.amount !== undefined) payload.amount = propsValue.amount;
    if (propsValue.transactionType) payload.transaction_type = propsValue.transactionType;
    if (propsValue.propertyAddress) payload.property_address = propsValue.propertyAddress;
    if (propsValue.propertyCity) payload.property_city = propsValue.propertyCity;
    if (propsValue.propertyState) payload.property_state = propsValue.propertyState;
    if (propsValue.propertyZipcode) payload.property_zipcode = propsValue.propertyZipcode;
    if (propsValue.beds !== undefined) payload.beds = propsValue.beds;
    if (propsValue.baths !== undefined) payload.baths = propsValue.baths;
    if (propsValue.sqft !== undefined) payload.sqft = propsValue.sqft;
    if (propsValue.mlsNumber) payload.mls_number = propsValue.mlsNumber;
    if (propsValue.closingDate) payload.closing_date = propsValue.closingDate;
    if (propsValue.agentId) payload.agent_id = propsValue.agentId;
    if (propsValue.agentName) payload.agent_name = propsValue.agentName;
    if (propsValue.agentEmail) payload.agent_email = propsValue.agentEmail;
    if (propsValue.source) payload.source = propsValue.source;
    if (propsValue.note) payload.note = propsValue.note;

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      `/leads/${leadId}/transaction`,
      payload
    );

    return response;
  },
});
