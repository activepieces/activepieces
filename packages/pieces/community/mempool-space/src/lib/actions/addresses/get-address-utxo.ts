import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getAddressUtxo = createAction({
 auth:PieceAuth.None(),
    name: 'get_address_utxo',
    displayName: 'Get Address UTXO',
    description: 'Returns unspent transaction outputs for an address',
    audience: 'both',
    aiMetadata: { description: 'Lists the unspent transaction outputs (UTXOs) currently held by a Bitcoin address, each with its txid, output index, value, and confirmation status. Read-only and idempotent, though the set changes as funds are spent or received. Use this to determine spendable coins or compute available balance for an address.', idempotent: true },
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to look up UTXOs for',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/address/${propsValue.address}/utxo`,
        });
        return response.body;
    },
});