import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'

export const getAddressCoinBalanceHistory = createAction({
  name: 'get_address_coin_balance_history',
  displayName: 'Get Address Coin Balance History',
  description: 'Get list of coin balance changes for an address',
  // category: 'Addresses',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Address Hash',
      description: 'Hash of the address to fetch coin balance history for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/addresses/${context.propsValue.addressHash}/coin-balance-history`,
    })
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`)
    }
    return response.body
  },
})
