import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getMainPageTransactions = createAction({
  name: 'get_main_page_transactions',
  displayName: 'Get Main Page Transactions',
  description: 'Get transactions for main page display',
  audience: 'both',
  aiMetadata: { description: 'Get the short list of latest Ethereum transactions shown on the Blockscout explorer home page. Read-only and takes no inputs. Use this for a quick at-a-glance feed of the most recent activity; for a fuller paginated transaction list use Get Transactions instead.', idempotent: true },
  // category: 'Transactions',
  props: {},
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://eth.blockscout.com/api/v2/main-page/transactions`,
    });
    if (response.status !== 200) {
      throw new Error(`Blockscout API request failed with status ${response.status}`);
    }
    return response.body;
  },
});
