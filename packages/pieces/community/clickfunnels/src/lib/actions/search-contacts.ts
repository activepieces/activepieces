import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const searchContacts = createAction({
    name: 'search_contacts',
    displayName: 'Search Contacts',
    description: 'Look up contacts by ID or email without creating them',
    auth: clickfunnelsAuth,
    props: {
        workspace_id: Property.ShortText({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace (optional for broader search)',
            required: false,
        }),
        search_type: Property.StaticDropdown({
            displayName: 'Search Type',
            description: 'How to search for contacts',
            required: true,
            options: {
                options: [
                    { label: 'By Contact ID', value: 'id' },
                    { label: 'By Email Address', value: 'email' },
                    { label: 'By Phone Number', value: 'phone' },
                    { label: 'List All Contacts', value: 'all' }
                ]
            }
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to find',
            required: false,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'Email address to search for',
            required: false,
        }),
        phone_number: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Phone number to search for',
            required: false,
        }),
        tag_ids: Property.ShortText({
            displayName: 'Tag IDs',
            description: 'Filter by tag IDs (comma-separated)',
            required: false,
        }),
        sort_order: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'Order to sort results',
            required: false,
            options: {
                options: [
                    { label: 'Newest First (ID Descending)', value: '-id' },
                    { label: 'Oldest First (ID Ascending)', value: 'id' },
                    { label: 'Email A-Z', value: 'email_address' },
                    { label: 'Email Z-A', value: '-email_address' },
                    { label: 'First Name A-Z', value: 'first_name' },
                    { label: 'First Name Z-A', value: '-first_name' },
                    { label: 'Last Name A-Z', value: 'last_name' },
                    { label: 'Last Name Z-A', value: '-last_name' }
                ]
            }
        }),
        after_cursor: Property.ShortText({
            displayName: 'After Cursor',
            description: 'Cursor for pagination (get contacts after this cursor)',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of contacts to return (default: 20, max: 200)',
            required: false,
        }),
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        
        if (context.propsValue.search_type === 'id') {
            if (!context.propsValue.contact_id) {
                throw new Error('Contact ID is required when searching by ID');
            }

            const response = await clickfunnelsCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/contacts/${context.propsValue.contact_id}`,
                subdomain,
            });

            return {
                data: [response.body],
                meta: { total: 1 }
            };
        }

        const queryParams: Record<string, string> = {};

        if (context.propsValue.search_type === 'email') {
            if (!context.propsValue.email_address) {
                throw new Error('Email address is required when searching by email');
            }
            queryParams['filter[email_address]'] = context.propsValue.email_address;
        }

        if (context.propsValue.search_type === 'phone') {
            if (!context.propsValue.phone_number) {
                throw new Error('Phone number is required when searching by phone');
            }
            queryParams['filter[phone_number]'] = context.propsValue.phone_number;
        }

        if (context.propsValue.tag_ids) {
            const tagIds = context.propsValue.tag_ids.split(',').map(id => id.trim()).filter(id => id);
            if (tagIds.length > 0) {
                queryParams['filter[tag_ids]'] = tagIds.join(',');
            }
        }

        if (context.propsValue.sort_order) {
            queryParams['sort'] = context.propsValue.sort_order;
        }

        if (context.propsValue.after_cursor) {
            queryParams['after'] = context.propsValue.after_cursor;
        }

        if (context.propsValue.limit) {
            const limit = Math.min(Math.max(1, context.propsValue.limit), 200);
            queryParams['limit'] = limit.toString();
        }

        const response = await clickfunnelsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts',
            queryParams,
            subdomain,
        });

        return {
            data: response.body,
            meta: { 
                total: response.body.length,
                search_type: context.propsValue.search_type,
                workspace_id: context.propsValue.workspace_id
            }
        };
    },
});
