import { createAction } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaCustomers } from '../../common/customers';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListCustomerGroupsAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_customer_groups',
  classification: 'SEARCH',
  displayName: 'List Customer Groups',
  description: 'Lists the customer groups in the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Salla store\'s customer groups with their id and name. Call it to get the group_id that Add Customers to Group needs and the group IDs that Create Customer, Update Customer and Create Coupon accept. Returns up to 500 groups and truncated=true when more exist.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.customerGroupList,
  props: {},
  async run({ auth }) {
    return sallaCustomers.listCustomerGroups({ auth });
  },
});
