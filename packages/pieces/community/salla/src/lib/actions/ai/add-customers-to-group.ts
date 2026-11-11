import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaCustomers } from '../../common/customers';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiAddCustomersToGroupAction = createAction({
  auth: sallaAuth,
  name: 'ai_add_customers_to_group',
  classification: 'WRITE',
  displayName: 'Add Customers to Group',
  description: 'Adds one or more customers to a customer group.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more Salla customers to a customer group and leaves their other group memberships as they are. Use it instead of Update Customer\'s group_ids, because Salla\'s docs do not say whether that replaces the current groups or adds to them; get group_id from List Customer Groups and customer IDs from List Customers. Adding a customer who is already in the group changes nothing, so a retry is safe.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.addCustomersToGroup,
  props: {
    group_id: Property.Number({
      displayName: 'Customer Group ID',
      description: 'Numeric customer group ID from List Customer Groups, for example 1227534533.',
      required: true,
    }),
    customer_ids: Property.Array({
      displayName: 'Customer IDs',
      description: 'Numeric Salla customer IDs from List Customers, at least one, for example ["1209983424", "1462397105"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaCustomers.addCustomersToGroup({
      auth,
      groupId: propsValue.group_id,
      customerIds: propsValue.customer_ids,
    });
  },
});
