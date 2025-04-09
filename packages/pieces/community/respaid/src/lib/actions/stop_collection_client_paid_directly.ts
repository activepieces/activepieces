import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { respaidAuth } from '../..'
import { respaidActionsCommon, respaidCommon } from '../common'

export const stopCollectionClientPaidDirectly = createAction({
  name: 'stop_collection_client_paid_directly',
  displayName: 'Stop Collection for Direct Full Payment',
  description: 'Stops the collection process for a case and mark it as paid directly to the creditor.',
  auth: respaidAuth,
  props: {
    unique_identifier: Property.ShortText({
      displayName: 'Unique Identifier',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    invoice_number: Property.ShortText({
      displayName: 'Invoice Number',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    respaidActionsCommon.validateProps(propsValue)

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${respaidCommon.baseUrl}/actions/stop_collection_client_paid_directly`,
      headers: respaidCommon.getHeadersStructure(auth),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    })
    return res.body
  },
})
