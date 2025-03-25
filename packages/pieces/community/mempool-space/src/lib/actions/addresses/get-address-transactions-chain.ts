import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getAddressTransactionsChain = createAction({
    name: 'get_address_transactions_chain',
    displayName: 'Get Address Transactions (Chain)',
    description: 'Returns confirmed transaction history (25 transactions per page)',
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to look up transactions for',
            required: true
        }),
        last_txid: Property.ShortText({
            displayName: 'Last Transaction ID',
            description: 'Optional: Last transaction ID for pagination',
            required: false
        })
    },
    async run({ propsValue }) {
        const queryParams: Record<string, string> = {};
        if (propsValue.last_txid) {
            queryParams['last_txid'] = propsValue.last_txid;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/address/${propsValue.address}/txs/chain`,
            queryParams
        });
        return response.body;
    },
});