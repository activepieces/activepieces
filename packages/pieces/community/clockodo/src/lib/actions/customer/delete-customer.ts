import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_customer',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Customer',
  description: 'Permanently deletes a customer in Clockodo. The customer must be set inactive first (Update Customer › Active Status = No).',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: {
    description:
      'Permanently deletes a Clockodo customer identified by its numeric customer_id. Clockodo only deletes inactive customers: set it inactive first (Update Customer with Active Status = No), otherwise it fails with "The resource must be inactive". Not idempotent: a second call for the same id fails because the customer no longer exists.',
    idempotent: false,
  },
  props: {
    customer_id: {
      ...clockodoCommon.customer_id(true, false),
      description: 'Only inactive customers can be deleted; set it inactive first (Update Customer › Active Status = No).',
    },
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' });
    await makeClient(auth.props).deleteCustomer(id);
    return deletedResult(id);
  },
});
