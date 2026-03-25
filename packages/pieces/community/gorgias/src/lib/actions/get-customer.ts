import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { findCustomerByEmail, gorgiasApiCall } from '../common/client';

export const getCustomerAction = createAction({
  auth: gorgiasAuth,
  name: 'get_gorgias_customer',
  displayName: 'Get Customer',
  description: 'Retrieve a Gorgias customer by ID or find one by email.',
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
        auth: context.auth.props,
        method: HttpMethod.GET,
        resourceUri: `/customers/${customerId}`,
      });
    }

    if (!email) {
      throw new Error('Provide either Customer ID or Email.');
    }

    const customer = await findCustomerByEmail(
      context.auth.props,
      email,
    );

    if (!customer) {
      throw new Error(`No customer found for email: ${email}`);
    }

    return customer;
  },
});
