import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'

export const getTokenHolders = createAction({
  name: 'get_token_holders',
  displayName: 'Get Token Holders',
  description: 'Get list of token holders',
  // category: 'Tokens',
  props: {
    addressHash: Property.ShortText({
      displayName: 'Token Address',
      description: 'Contract address of the token to fetch holders for',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/tokens/${context.propsValue.addressHash}/holders`,
    })
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`)
    }
    return response.body
  },
})
