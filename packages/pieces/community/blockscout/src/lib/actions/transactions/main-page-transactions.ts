import { createAction } from '@ensemble/pieces-framework';
import { httpClient, HttpMethod } from '@ensemble/pieces-common';

export const getMainPageTransactions = createAction({
  name: 'get_main_page_transactions',
  displayName: 'Get Main Page Transactions',
  description: 'Get transactions for main page display',
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
