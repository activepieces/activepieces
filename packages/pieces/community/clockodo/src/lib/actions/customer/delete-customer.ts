import { createAction } from '@activepieces/pieces-framework';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_customer',
  displayName: 'Delete Customer',
  description: 'Deletes a customer in clockodo',
  props: {
    customer_id: clockodoCommon.customer_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    await client.deleteCustomer(propsValue.customer_id as number);
  },
});
