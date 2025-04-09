import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'

export const getAddressWithdrawals = createAction({
  name: 'get_address_withdrawals',
  displayName: 'Get Address Withdrawals',
  description: 'Get list of withdrawals for an address',
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch withdrawals for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/withdrawals`,
    })
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`)
    }
    return response.body
  },
})
