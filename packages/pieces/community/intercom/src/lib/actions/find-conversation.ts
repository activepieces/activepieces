import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import { Operators } from 'intercom-client';
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

        let operator = Operators.EQUALS;
        if (matchType === 'contains') {
            operator = Operators.CONTAINS;
        }
        if (matchType === 'equals') {
            operator = Operators.EQUALS;
        }
        if (matchType === 'starts_with') {
            operator = Operators.STARTS_WITH;
        }

        const client = intercomClient(context.auth);

        const filter = [
            {
                field: searchField,
                operator: operator as Operators,
                value: searchTerm,
            },
        ];
        if (status) {
            filter.push({
                field: 'state',
                operator: Operators.EQUALS,
                value: status,
            });
        }
        if (updateAfter) {
            filter.push({
                field: 'updated_at',
                operator: Operators.GREATER_THAN,
                value: dayjs(updateAfter).unix().toString(),
            });
        }
        if (updateBefore) {
            filter.push({
                field: 'updated_at',
                operator: Operators.LESS_THAN,
                value: dayjs(updateBefore).unix().toString(),
            });
        }

        const response = await client.conversations.search({
            data: {
                query: {
                    operator: Operators.AND,
                    value: filter,
                },
            },
        });

        return {
            found: response.total_count > 0,
            conversation: response.conversations,
        };
    },
});