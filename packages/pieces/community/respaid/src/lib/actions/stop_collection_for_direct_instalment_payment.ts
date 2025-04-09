import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { respaidAuth } from '../..'
import { respaidActionsCommon, respaidCommon } from '../common'

export const stopCollectionForDirectInstalmentPayment = createAction({
  name: 'stop_collection_for_direct_instalment_payment',
  displayName: 'Stop Collection for Direct Instalment Payment',
  description: 'Stops the collection process for a case when an instalment plan is set up with the creditor.',
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
      url: `${respaidCommon.baseUrl}/actions/stop_collection_for_direct_instalment_payment`,
      headers: respaidCommon.getHeadersStructure(auth),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    })
    return res.body
  },
})
