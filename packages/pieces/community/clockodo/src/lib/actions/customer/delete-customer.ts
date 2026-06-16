import { createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_customer',
  displayName: 'Delete Customer',
  description: 'Deletes a customer in clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a clockodo customer identified by its numeric customer_id. Use when removing a client record entirely; deletion may fail if the customer still has linked projects or time entries. Idempotent: the customer reaches the same deleted end state on repeated calls (later calls fail because it no longer exists).',
    idempotent: true,
  },
  props: {
    customer_id: clockodoCommon.customer_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    await client.deleteCustomer(propsValue.customer_id as number);
  },
});
