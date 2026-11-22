import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_customer',
  classification: 'READ',
  displayName: 'Get Customer',
  description: 'Retrieves a single customer from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.customer,
  aiMetadata: {
    description:
      'Looks up one Clockodo customer by its numeric customer_id and returns that customer record. Use to confirm a customer exists or read its current details before creating an entry or updating it; requires a known customer_id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    customer_id: clockodoCommon.customer_id(true, undefined),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.customer_id, field: 'Customer' });
    return makeClient(auth.props).getCustomer(id);
  },
});
