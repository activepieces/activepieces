import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaCustomers } from '../common/customers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const addCustomersToGroupAction = createAction({
  auth: sallaAuth,
  name: 'add_customers_to_group',
  classification: 'WRITE',
  displayName: 'Add Customers to Group',
  description: 'Adds one or more customers to a customer group. Their other groups stay as they are.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one or more Salla customers, by numeric customer ID, to one customer group and leaves their other groups alone. Use it instead of Update Customer when you only need to put customers in a group; use Find Customers to get the IDs first. Adding a customer who is already in the group changes nothing, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.addCustomersToGroup,
  props: {
    group: sallaProps.customerGroup({
      required: true,
      description: 'The group to add the customers to, for example VIP Customers. In a flow, map the numeric group ID, for example 1226617469.',
    }),
    customer_ids: Property.Array({
      displayName: 'Customer IDs',
      description:
        'Numeric customer IDs, one per row, for example 1227534533. Map them from a trigger or from Find Customers, or copy one from the end of the customer page link in the Salla dashboard.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.addCustomersToGroup({
      auth,
      groupId: propsValue.group,
      customerIds: propsValue.customer_ids,
    });
  },
});
