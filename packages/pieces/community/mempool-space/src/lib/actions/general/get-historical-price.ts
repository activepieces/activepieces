import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEMPOOL_API_BASE_URL } from '../../common';

export const getHistoricalPrice = createAction({
    name: 'get_historical_price',
    displayName: 'Get Historical Price',
    description: 'Returns bitcoin historical price in main currencies',
    // category: 'General',
    props: {
        currency: Property.StaticDropdown({
            displayName: 'Currency',
            description: 'Select the currency for historical price',
            required: true,
            options: {
                options: [
                    { label: 'US Dollar', value: 'USD' },
                    { label: 'Euro', value: 'EUR' },
                    { label: 'British Pound', value: 'GBP' },
                    { label: 'Canadian Dollar', value: 'CAD' },
                    { label: 'Swiss Franc', value: 'CHF' },
                    { label: 'Australian Dollar', value: 'AUD' },
                    { label: 'Japanese Yen', value: 'JPY' }
                ]
            }
        }),
        dateTime: Property.DateTime({
            displayName: 'Price lookup date',
            description: 'Provide YYYY-MM-DD format.',
            required: true
        })
    },
    async run({ propsValue }) {
        const queryParams: Record<string, string> = {};
        if (propsValue.currency) {
            queryParams['currency'] = propsValue.currency;
        }
        if (propsValue.dateTime) {
            const date = new Date(propsValue.dateTime);
            queryParams['timestamp'] = date.getTime().toString();
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${MEMPOOL_API_BASE_URL}/api/v1/historical-price`,
            queryParams
        });
        return response.body;
    },
});