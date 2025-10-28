import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { sendBigCommerceRequest, handleBigCommerceError } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const apiRequest = createAction({
    auth: bigcommerceAuth,
    name: 'api_request',
    displayName: 'API Request (Beta)',
    description: 'Makes a raw HTTP request with BigCommerce authentication',
    props: {
        method: Property.StaticDropdown({
            displayName: 'HTTP Method',
            description: 'HTTP method to use',
            required: true,
            defaultValue: 'GET',
            options: {
                disabled: false,
                options: [
                    { label: 'GET', value: 'GET' },
                    { label: 'POST', value: 'POST' },
                    { label: 'PUT', value: 'PUT' },
                    { label: 'PATCH', value: 'PATCH' },
                    { label: 'DELETE', value: 'DELETE' },
                ],
            },
        }),
        url: Property.ShortText({
            displayName: 'URL Path',
            description: 'API endpoint path (e.g., /customers, /catalog/products)',
            required: true,
        }),
        queryParams: Property.Object({
            displayName: 'Query Parameters',
            description: 'Query parameters as JSON object',
            required: false,
        }),
        body: Property.Object({
            displayName: 'Request Body',
            description: 'Request body as JSON object (for POST, PUT, PATCH)',
            required: false,
        }),
    },
    async run(context) {
        const { method, url, queryParams, body } = context.propsValue;

        if (!method || !url) {
            throw new Error('HTTP method and URL path are required');
        }

        try {
            const response = await sendBigCommerceRequest({
                auth: context.auth,
                url: url.startsWith('/') ? url : `/${url}`,
                method: method as HttpMethod,
                queryParams: queryParams as Record<string, string> || undefined,
                body: body || undefined,
            });

            return {
                success: true,
                status: response.status,
                headers: response.headers,
                data: response.body,
            };
        } catch (error) {
            throw handleBigCommerceError(error, 'API request failed');
        }
    },
});