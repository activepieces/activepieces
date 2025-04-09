import { createAction } from '@activepieces/pieces-framework'
import { clockodoAuth } from '../../../'
import { clockodoCommon, makeClient } from '../../common'

export default createAction({
  auth: clockodoAuth,
  name: 'get_customer',
  displayName: 'Get Customer',
  description: 'Retrieves a single customer from clockodo',
  props: {
    customer_id: clockodoCommon.customer_id(true, undefined),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth)
    const res = await client.getCustomer(propsValue.customer_id as number)
    return res.customer
  },
})
