import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'

export const getBlocks = createAction({
  name: 'get_blocks',
  displayName: 'Get Blocks',
  description: 'Get list of blocks',
  // category: 'Blocks',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/blocks`,
    })
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`)
    }
    return response.body
  },
})
