import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieves a single customer from clockodo',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up one clockodo customer by its numeric customer_id and returns that customer record. Use to confirm a customer exists or read its current details before creating an entry or updating it; requires a known customer_id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer_id: clockodoCommon.customer_id(true, undefined),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getCustomer(propsValue.customer_id as number);
    return res.customer;
  },
});
