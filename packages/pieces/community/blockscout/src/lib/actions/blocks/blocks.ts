import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getBlocks = createAction({
  name: 'get_blocks',
  displayName: 'Get Blocks',
  description: 'Get list of blocks',
  audience: 'both',
  aiMetadata: { description: 'List recent Ethereum blocks across the chain (newest first), takes no inputs. Read-only. Use this for chain-wide block browsing; to fetch one specific block use Get Block by Hash or Number.', idempotent: true },
  // category: 'Blocks',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/blocks`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
