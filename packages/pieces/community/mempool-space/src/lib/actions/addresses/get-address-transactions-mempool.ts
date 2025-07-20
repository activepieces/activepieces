import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getAddressTransactionsMempool = createAction({
    name: 'get_address_transactions_mempool',
    displayName: 'Get Address Transactions (Mempool)',
    description: 'Returns unconfirmed transactions (up to 50)',
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to look up mempool transactions for',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/address/${propsValue.address}/txs/mempool`,
        });
        return response.body;
    },
});