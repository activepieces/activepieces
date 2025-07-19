import { createAction, Property } from '@ensemble/pieces-framework';
import { httpClient, HttpMethod } from '@ensemble/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const validateAddress = createAction({
    name: 'validate_address',
    displayName: 'Validate Address',
    description: 'Validates a Bitcoin address',
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