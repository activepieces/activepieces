import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getBlockTransactions = createAction({
    name: 'get_block_transactions',
    displayName: 'Get Block Transactions',
    description: 'Returns a list of transactions in the block (up to 25 transactions)',
    // category: 'Blocks',
    props: {
        hash: Property.ShortText({
            displayName: 'Block Hash',
            description: 'The hash of the block',
            required: true
        }),
        startIndex: Property.Number({
            displayName: 'Start Index',
            description: 'Optional: Starting index for pagination',
            required: false
        })
    },
    async run({ propsValue }) {
        let url = `${MEMPOOL_API_BASE_URL}/api/block/${propsValue.hash}/txs`;
        if (propsValue.startIndex !== undefined) {
            url += `/${propsValue.startIndex}`;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
        });
        return response.body;
    },
});