import { Property, createAction } from '@activepieces/pieces-framework'
import { pastefyAuth } from '../..'
import { makeClient } from '../common'

export default createAction({
  auth: pastefyAuth,
  name: 'delete_paste',
  displayName: 'Delete Paste',
  description: 'Deletes a paste',
  props: {
    paste_id: Property.ShortText({
      displayName: 'Paste ID',
      required: true,
    }),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue)
    const res = await client.deletePaste(context.propsValue.paste_id)
    return res
  },
})
