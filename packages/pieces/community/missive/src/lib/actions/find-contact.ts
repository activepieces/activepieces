import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';
import { contactBookDropdown } from '../common/dynamic-dropdowns';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Search for contacts by text, email, name, or any contact information',
    auth: missiveAuth,
    props: {
        contact_book: contactBookDropdown,
        search: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search across all contact information including name, email, phone, organization, custom fields, notes, etc. Leave empty to get all contacts.',
            required: false,
        }),
        search_options: Property.DynamicProperties({
            displayName: 'Search & Filter Options',
            description: 'Configure how to search and filter contacts',
            required: false,
            refreshers: [],
            props: async ({ auth }) => {
                if (!auth) {
                    return {
                        order: Property.StaticDropdown({
                            displayName: 'Please Authenticate',
                            description: 'Please authenticate to access search options',
                            required: false,
                            options: {
                                disabled: true,
                                options: [{ label: 'Please authenticate first', value: '' }]
                            }
                        }),
                        limit: Property.Number({
                            displayName: 'Results Limit',
                            description: 'Please authenticate first',
                            required: false,
                            defaultValue: 50,
                        }),
                        offset: Property.Number({
                            displayName: 'Offset',
                            description: 'Please authenticate first',
                            required: false,
                            defaultValue: 0,
                        }),
                        modified_since: Property.DateTime({
                            displayName: 'Modified Since',
                            description: 'Please authenticate first',
                            required: false,
                        }),
                        include_deleted: Property.Checkbox({
                            displayName: 'Include Deleted Contacts',
                            description: 'Please authenticate first',
                            required: false,
                            defaultValue: false,
                        })
                    };
                }

                return {
                    order: Property.StaticDropdown({
                        displayName: 'Sort Order',
                        description: 'How to order the contact results',
                        required: false,
                        defaultValue: 'last_name',
                        options: {
                            options: [
                                { label: 'Last Name (A-Z)', value: 'last_name' },
                                { label: 'Last Modified (Newest First)', value: 'last_modified' }
                            ]
                        }
                    }),
                    limit: Property.Number({
                        displayName: 'Results Limit',
                        description: 'Maximum number of contacts to return (1-200)',
                        required: false,
                        defaultValue: 50,
                    }),
                    offset: Property.Number({
                        displayName: 'Offset',
                        description: 'Number of contacts to skip (for pagination)',
                        required: false,
                        defaultValue: 0,
                    }),
                    modified_since: Property.DateTime({
                        displayName: 'Modified Since',
                        description: 'Only return contacts modified or created after this date/time',
                        required: false,
                    }),
                    include_deleted: Property.Checkbox({
                        displayName: 'Include Deleted Contacts',
                        description: 'Include deleted contacts when using "Modified Since" filter (only shows ID and deleted status)',
                        required: false,
                        defaultValue: false,
                    })
                };
            },
        }),
        result_format: Property.StaticDropdown({
            displayName: 'Result Format',
            description: 'How to format the returned contact data',
            required: false,
            defaultValue: 'full',
            options: {
                options: [
                    { label: 'Full Contact Data', value: 'full' },
                    { label: 'Summary Only', value: 'summary' },
                    { label: 'Count Only', value: 'count' }
                ]
            }
        })
    },
    async run(context) {
        const propsValue = context.propsValue as any;
        const { 
            contact_book, 
            search,
            result_format
        } = propsValue;

        if (!contact_book) {
            throw new Error('Contact book is required to search for contacts');
        }

        // Build query parameters
        const queryParams: Record<string, string> = {
            contact_book: contact_book
        };

        if (search && search.trim()) {
            queryParams['search'] = search.trim();
        }

        // Handle search options
        const searchOptions = propsValue['search_options'] || {};
        
        if (searchOptions['order']) {
            queryParams['order'] = searchOptions['order'];
        }
        
        if (searchOptions['limit'] && searchOptions['limit'] > 0) {
            const limit = Math.min(Math.max(1, parseInt(searchOptions['limit'])), 200);
            queryParams['limit'] = limit.toString();
        }
        
        if (searchOptions['offset'] && searchOptions['offset'] >= 0) {
            queryParams['offset'] = parseInt(searchOptions['offset']).toString();
        }
        
        if (searchOptions['modified_since']) {
            const date = new Date(searchOptions['modified_since']);
            const timestamp = Math.floor(date.getTime() / 1000);
            queryParams['modified_since'] = timestamp.toString();
        }
        
        if (searchOptions['include_deleted']) {
            queryParams['include_deleted'] = 'true';
        }

        // Make API call
        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts',
            queryParams,
        });

        const contacts = response.body?.contacts || [];

        // Format results based on user preference
        if (result_format === 'count') {
            return {
                total_found: contacts.length,
                search_term: search || 'all contacts',
                contact_book_id: contact_book,
                filters_applied: {
                    order: searchOptions['order'] || 'last_name',
                    limit: queryParams['limit'] || '50',
                    modified_since: searchOptions['modified_since'] || null,
                    include_deleted: searchOptions['include_deleted'] || false
                }
            };
        } else if (result_format === 'summary') {
            return {
                total_found: contacts.length,
                contacts: contacts.map((contact: any) => {
                    const primaryEmail = contact.infos?.find((info: any) => info.kind === 'email')?.value;
                    const primaryPhone = contact.infos?.find((info: any) => info.kind === 'phone_number')?.value;
                    const primaryOrg = contact.memberships?.find((membership: any) => 
                        membership.group?.kind === 'organization'
                    )?.group?.name;

                    return {
                        id: contact.id,
                        name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'No Name',
                        first_name: contact.first_name || null,
                        last_name: contact.last_name || null,
                        primary_email: primaryEmail || null,
                        primary_phone: primaryPhone || null,
                        primary_organization: primaryOrg || null,
                        starred: contact.starred || false,
                        deleted: contact.deleted || false,
                        modified_at: contact.modified_at,
                        contact_book: contact.contact_book
                    };
                }),
                search_info: {
                    search_term: search || 'all contacts',
                    contact_book_id: contact_book,
                    order: searchOptions['order'] || 'last_name',
                    limit: parseInt(queryParams['limit'] || '50'),
                    offset: parseInt(queryParams['offset'] || '0')
                }
            };
        } else {
            // Full format - return complete API response with metadata
            return {
                total_found: contacts.length,
                contacts: contacts,
                search_info: {
                    search_term: search || 'all contacts',
                    contact_book_id: contact_book,
                    api_endpoint: '/v1/contacts',
                    filters_applied: {
                        order: searchOptions['order'] || 'last_name',
                        limit: parseInt(queryParams['limit'] || '50'),
                        offset: parseInt(queryParams['offset'] || '0'),
                        modified_since: searchOptions['modified_since'] || null,
                        include_deleted: searchOptions['include_deleted'] || false
                    }
                }
            };
        }
    },
});