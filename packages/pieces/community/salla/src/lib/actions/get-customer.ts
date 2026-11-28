import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaCustomers } from '../common/customers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const getCustomerAction = createAction({
  auth: sallaAuth,
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Gets one customer by ID, with their order count, total spent, wallet balance and loyalty points if you want them.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one Salla customer by numeric customer ID (for example 1227534533), with name, mobile, email, city and groups, plus order count, total spent, wallet balance and loyalty points when Include Stats is on. Use Find Customers or List Customers to look a customer up by name, mobile or email first. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.customer,
  props: {
    customer: sallaProps.customer({
      required: true,
      description: 'The customer to get. Search by name or mobile, or map the numeric customer ID, for example 1227534533.',
    }),
    include_stats: Property.Checkbox({
      displayName: 'Include Stats',
      description: 'Also return the order count, total spent, average order, latest purchase, wallet balance, loyalty points and block status.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.getCustomer({
      auth,
      customerId: propsValue.customer,
      includeStats: propsValue.include_stats === true,
    });
  },
});
