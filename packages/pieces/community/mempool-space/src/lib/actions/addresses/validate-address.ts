import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const validateAddress = createAction({
 auth:PieceAuth.None(),
    name: 'validate_address',
    displayName: 'Validate Address',
    description: 'Validates a Bitcoin address',
    audience: 'both',
    aiMetadata: { description: 'Checks whether a string is a valid Bitcoin address and reports its type and script details without touching chain history. Read-only and idempotent. Use this as a cheap pre-check before any address lookup; it confirms format/validity only, not whether the address has ever been used or holds funds.', idempotent: true },
    // category: 'Addresses',
    props: {
        address: Property.ShortText({
            displayName: 'Address',
            description: 'The Bitcoin address to validate',
            required: true
        })
    },
    async run({ propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/validate-address/${propsValue.address}`,
        });
        return response.body;
    },
});