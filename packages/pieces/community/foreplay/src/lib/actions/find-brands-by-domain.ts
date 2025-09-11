import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';

export const findBrandsByDomain = createAction({
    auth: foreplayAuth,
    name: 'find_brands_by_domain',
    displayName: 'Find Brands by Domain',
    description: 'Search for brands associated with a specific website domain.',
    props: {
        domain: Property.ShortText({
            displayName: 'Domain',
            description: "The domain to search for (e.g., 'foreplay.co').",
            required: true,
        }),
        order: Property.StaticDropdown({
            displayName: 'Order By',
            description: "Sort brands by relevance ranking.",
            required: false,
            defaultValue: 'most_ranked',
            options: {
                options: [
                    { label: 'Most Ranked', value: 'most_ranked' },
                    { label: 'Least Ranked', value: 'least_ranked' },
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of brands to return (default 10, max 10).',
            required: false,
        }),
    },
    async run(context) {
        const { apiKey } = context.auth;
        const props = context.propsValue;

        const queryParams: Record<string, string> = {};

        queryParams['domain'] = props['domain'] as string;
        
        if (props['order']) {
            queryParams['order'] = props['order'] as string;
        }
        if (props['limit']) {
            queryParams['limit'] = String(props['limit']);
        }

        const response = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `https://public.api.foreplay.co/api/brand/getBrandsByDomain`,
            queryParams: queryParams,
            headers: {
                'Authorization': apiKey
            }
        });

        return response.body['data'];
    },
});