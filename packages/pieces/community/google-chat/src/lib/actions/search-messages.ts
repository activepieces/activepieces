import { createAction, Property } from '@activepieces/pieces-framework';
import {
    HttpMethod,
    httpClient,
    AuthenticationType,
    HttpRequest,
} from '@activepieces/pieces-common';
import { googleChatAuth } from '../..';
import { googleChatCommon, GCHAT_API_URL } from '../common';
import dayjs from 'dayjs';

export const searchMessages = createAction({
    auth: googleChatAuth,
    name: 'search_messages',
    displayName: 'Search Messages',
    description: 'Search for messages within a space using filters.',
    props: {
        space: googleChatCommon.space,
        created_after: Property.DateTime({
            displayName: 'Created After',
            description: 'Search for messages created after this date and time.',
            required: false,
        }),
        created_before: Property.DateTime({
            displayName: 'Created Before',
            description: 'Search for messages created before this date and time.',
            required: false,
        }),
        thread_name: Property.ShortText({
            displayName: 'Thread Name',
            description: 'Filter messages by a specific thread. Format: `spaces/{space}/threads/{thread}`',
            required: false,
        }),
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'The maximum number of messages to return. The default is 25, and the maximum is 1000.',
            required: false,
        }),
        orderBy: Property.StaticDropdown({
            displayName: 'Order Direction',
            description: 'The direction to order messages by their creation time.',
            required: false,
            options: {
                options: [
                    { label: 'Oldest First (Ascending)', value: 'ASC' },
                    { label: 'Newest First (Descending)', value: 'DESC' },
                ]
            }
        }),
        showDeleted: Property.Checkbox({
            displayName: 'Show Deleted Messages',
            description: 'If true, includes deleted messages in the results.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const {
            space,
            created_after,
            created_before,
            thread_name,
            pageSize,
            orderBy,
            showDeleted
        } = context.propsValue;

        const queryParams: Record<string, unknown> = {};
        const filterParts: string[] = [];

        if (created_after) {
            // Format timestamp in RFC-3339 format and wrap in double quotes
            filterParts.push(`createTime > "${dayjs(created_after).toISOString()}"`);
        }
        if (created_before) {
            filterParts.push(`createTime < "${dayjs(created_before).toISOString()}"`);
        }
        if (thread_name) {
            // Thread name does not require quotes
            filterParts.push(`thread.name = ${thread_name}`);
        }

        if (filterParts.length > 0) {
            queryParams['filter'] = filterParts.join(' AND ');
        }
        
        if (pageSize) {
            queryParams['pageSize'] = pageSize;
        }

        if (orderBy) {
             queryParams['orderBy'] = `createTime ${orderBy}`;
        }

        if (showDeleted) {
            queryParams['showDeleted'] = true;
        }

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${GCHAT_API_URL}/${space}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            },
            queryParams: queryParams as Record<string, string>,
        };

        const response = await httpClient.sendRequest(request);
        // The response body contains the 'messages' array and an optional 'nextPageToken'
        return response.body;
    },
});