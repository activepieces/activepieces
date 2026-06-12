import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getAddressTransactions = createAction({
 auth:PieceAuth.None(),
    name: 'get_address_transactions',
    displayName: 'Get Address Transactions',
    description: 'Returns transaction history (up to 50 mempool + 25 confirmed transactions)',
    audience: 'both',
    aiMetadata: { description: 'Returns the combined transaction history for a Bitcoin address (up to 50 unconfirmed mempool plus 25 confirmed transactions), with an optional after transaction ID to page through older entries. Read-only and idempotent. Use this for a single mixed view; choose the dedicated Chain or Mempool variants when you need only confirmed or only pending transactions.', idempotent: true },
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to look up transactions for',
            required: true
        }),
        after_txid: Property.ShortText({
            displayName: 'After Transaction ID',
            description: 'Optional: Get transactions after this transaction ID (for pagination)',
            required: false
        })
    },
    async run({ propsValue }) {
        const queryParams: Record<string, string> = {};
        if (propsValue.after_txid) {
            queryParams['after_txid'] = propsValue.after_txid;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/address/${propsValue.address}/txs`,
            queryParams
        });
        return response.body;
    },
});