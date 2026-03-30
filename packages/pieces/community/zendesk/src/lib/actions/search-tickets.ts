import { createAction } from '@activepieces/pieces-framework';
import { zendeskAuth } from '../../auth';
import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchTicketsAction = createAction({
    auth: zendeskAuth,
    name: 'search_tickets',
    displayName: 'Search Tickets (Advanced)',
    description: 'Search for tickets using Zendesk advanced search syntax (e.g., type:ticket status:open).',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'The Zendesk search query string (e.g., "status<solved priority:high"). See Zendesk search documentation for details.',
            required: true,
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Field to sort the results by.',
            required: false,
            options: {
                options: [
                    { label: 'Created At', value: 'created_at' },
                    { label: 'Updated At', value: 'updated_at' },
                    { label: 'Priority', value: 'priority' },
                    { label: 'Status', value: 'status' },
                ]
            }
        }),
        sort_order: Property.StaticDropdown({
            displayName: 'Sort Order',
            required: false,
            options: {
                options: [
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' },
                ]
            }
        })
    },
    async run(context) {
        const { query, sort_by, sort_order } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${context.auth.baseUrl}/api/v2/search.json`,
            queryParams: {
                query: query,
                sort_by: sort_by || 'created_at',
                sort_order: sort_order || 'desc',
            },
            headers: {
                Authorization: `Basic ${Buffer.from(`${context.auth.email}/token:${context.auth.apiToken}`).toString('base64')}`,
            },
        });

        return response.body;
    },
});
