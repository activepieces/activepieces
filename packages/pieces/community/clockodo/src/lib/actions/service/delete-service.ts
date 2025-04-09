import { createAction } from '@activepieces/pieces-framework'
import { clockodoAuth } from '../../../'
import { clockodoCommon, makeClient } from '../../common'

export default createAction({
  auth: clockodoAuth,
  name: 'delete_service',
  displayName: 'Delete Service',
  description: 'Deletes a service in clockodo',
  props: {
    service_id: clockodoCommon.service_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth)
    await client.deleteService(propsValue.service_id as number)
  },
})
