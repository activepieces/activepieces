import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient, Operator } from '../common';
import dayjs from 'dayjs';

export const findConversationAction = createAction({
    auth: intercomAuth,
    name: 'find-conversation',
    displayName: 'Find Conversation',
    description: 'Searches for conversations using various criteria',
    props: {
        searchField: Property.StaticDropdown({
            displayName: 'Search Field',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'Conversation ID', value: 'id' },
                    { label: 'Subject', value: 'source.subject' },
                    { label: 'Message Body', value: 'source.body' },
                    { label: 'Author Email', value: 'source.author.email' },
                    { label: 'Assigned Admin', value: 'admin_assignee_id' },
                    { label: 'Team', value: 'team_assignee_id' },
                    { label: 'Tag IDs', value: 'tag_ids' },
                ],
            },
        }),
        matchType: Property.StaticDropdown({
            displayName: 'Match Type',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'Contains', value: 'contains' },
                    { label: 'Equals', value: 'equals' },
                    { label: 'Starts With', value: 'starts_with' },
                ],
            },
        }),
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            options: {
                disabled: false,
                options: [
                    { label: 'Open', value: 'open' },
                    { label: 'Closed', value: 'closed' },
                ],
            },
        }),
        updateAfter: Property.DateTime({
            displayName: 'Update After',
            required: false,
        }),
        updateBefore: Property.DateTime({
            displayName: 'Update Before',
            required: false,
        }),
    },
    async run(context) {
        const { searchField, matchType, searchTerm, status, updateAfter, updateBefore } =
            context.propsValue;

        const operator = matchType === 'contains' ? '~' : matchType === 'starts_with' ? '^' : '=';


        const client = intercomClient(context.auth);

        const filter = [
            {
                field: searchField,
                operator: operator as Operator,
                value: searchTerm,
            },
        ];
        if (status) {
            filter.push({
                field: 'state',
                operator: "=",
                value: status,
            });
        }
        if (updateAfter) {
            filter.push({
                field: 'updated_at',
                operator: '>',
                value: dayjs(updateAfter).unix().toString(),
            });
        }
        if (updateBefore) {
            filter.push({
                field: 'updated_at',
                operator: "<",
                value: dayjs(updateBefore).unix().toString(),
            });
        }

        const response = await client.conversations.search({
            query: {
				operator: 'AND',
				value: filter,
			},
        });

        return {
            found: response.data.length > 0,
            conversation: response.data.length > 0 ? response.data[0] : {},
        };
    },
});