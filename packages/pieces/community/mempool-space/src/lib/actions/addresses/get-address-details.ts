import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getAddressDetails = createAction({
 auth:PieceAuth.None(),
    name: 'get_address_details',
    displayName: 'Get Address Details',
    description: 'Returns address details including chain and mempool stats',
    audience: 'both',
    aiMetadata: { description: 'Returns aggregate statistics for a Bitcoin address: total funded/spent amounts and transaction counts split across confirmed chain and pending mempool. Read-only and idempotent. Use this to compute an address balance or activity summary in one call; use the transaction-list actions to enumerate individual transactions or Get Address UTXO for spendable outputs.', idempotent: true },
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to look up',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/address/${propsValue.address}`,
        });
        return response.body;
    },
});