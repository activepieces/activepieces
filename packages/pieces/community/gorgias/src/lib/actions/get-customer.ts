import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { findCustomerByEmail, gorgiasApiCall } from '../common/client';

export const getCustomerAction = createAction({
  auth: gorgiasAuth,
  name: 'get_gorgias_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a Gorgias customer by ID or find one by email.',
  audience: 'both',
  aiMetadata: { description: 'Look up a single Gorgias customer, operating in one of two modes: pass a Customer ID to fetch it directly, or omit the ID and pass an Email to search customers server-side and return the match. Use to resolve a customer record before working with their tickets; supply exactly one of the two inputs and the call errors if neither is given or no email match is found. Idempotent read-only lookup.', idempotent: true },
  props: {
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'Use this when you already know the customer ID.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'If Customer ID is not provided, search customers by email using Gorgias server-side filtering.',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, email } = context.propsValue;

    if (customerId) {
      return await gorgiasApiCall({
        auth: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/customers/${customerId}`,
      });
    }

    if (!email) {
      throw new Error('Provide either Customer ID or Email.');
    }

    const customer = await findCustomerByEmail(
      context.auth,
      email,
    );

    if (!customer) {
      throw new Error(`No customer found for email: ${email}`);
    }

    return customer;
  },
});
