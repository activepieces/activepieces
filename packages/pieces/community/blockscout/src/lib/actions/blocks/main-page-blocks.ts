import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMainPageBlocks = createAction({
  name: 'get_main_page_blocks',
  displayName: 'Get Main Page Blocks',
  description: 'Get blocks for main page display',
  audience: 'both',
  aiMetadata: { description: 'Get the short list of latest blocks shown on the Blockscout explorer home page, takes no inputs. Read-only. Use this for a quick at-a-glance feed of the newest blocks; for a fuller paginated block list use Get Blocks.', idempotent: true },
  // category: 'Blocks',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/main-page/blocks`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
