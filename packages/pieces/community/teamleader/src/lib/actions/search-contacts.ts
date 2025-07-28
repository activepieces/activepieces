import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchContacts = createAction({
    name: 'search_contacts',
    displayName: 'Search Contacts',
    description: 'List or filter contacts in Teamleader',
    auth: teamleaderAuth,
    props: {
        filter_by: Property.StaticDropdown({
            displayName: 'Filter By',
            description: 'Choose how to filter contacts',
            required: false,
            options: {
                options: [
                    { label: 'No Filter (List All)', value: 'none' },
                    { label: 'First Name', value: 'first_name' },
                    { label: 'Last Name', value: 'last_name' },
                    { label: 'Email', value: 'email' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'City', value: 'city' },
                    { label: 'Country', value: 'country' },
                    { label: 'Language', value: 'language' },
                    { label: 'Tag', value: 'tag' }
                ]
            },
            defaultValue: 'none'
        }),
        filter_value: Property.ShortText({
            displayName: 'Filter Value',
            description: 'Value to filter by (required if filter is selected)',
            required: false,
        }),
        company_id: Property.Dropdown({
            displayName: 'Filter By Company',
            description: 'Filter contacts by their associated company',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                try {
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: '/companies.list'
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((company: any) => ({
                            label: company.name,
                            value: company.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading companies'
                    };
                }
            }
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Choose field to sort results by',
            required: false,
            options: {
                options: [
                    { label: 'First Name (A-Z)', value: 'first_name' },
                    { label: 'First Name (Z-A)', value: '-first_name' },
                    { label: 'Last Name (A-Z)', value: 'last_name' },
                    { label: 'Last Name (Z-A)', value: '-last_name' },
                    { label: 'Added (Newest First)', value: '-added_at' },
                    { label: 'Added (Oldest First)', value: 'added_at' },
                    { label: 'Updated (Most Recent First)', value: '-updated_at' },
                    { label: 'Updated (Oldest First)', value: 'updated_at' }
                ]
            }
        }),
        page_size: Property.Number({
            displayName: 'Results Per Page',
            description: 'Number of results to return per page (max 100)',
            required: false,
            defaultValue: 20
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Page number to return',
            required: false,
            defaultValue: 1
        }),
        include_details: Property.Checkbox({
            displayName: 'Include Detailed Information',
            description: 'Fetch detailed information for each contact',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const { filter_by, filter_value, company_id, sort_by, page_size, page, include_details } = context.propsValue;
        
        // Prepare query parameters
        const queryParams: Record<string, string> = {};
        
        // Add pagination parameters
        if (page) {
            queryParams['page[number]'] = page.toString();
        }
        
        if (page_size) {
            const size = Math.min(page_size, 100); // Cap at 100 which is typically API max
            queryParams['page[size]'] = size.toString();
        }
        
        // Add sorting parameter
        if (sort_by) {
            queryParams['sort'] = sort_by;
        }
        
        // Add filter parameters
        if (filter_by && filter_by !== 'none' && filter_value) {
            if (filter_by === 'first_name') {
                queryParams['filter[first_name]'] = filter_value;
            } else if (filter_by === 'last_name') {
                queryParams['filter[last_name]'] = filter_value;
            } else if (filter_by === 'email') {
                queryParams['filter[email]'] = filter_value;
            } else if (filter_by === 'phone') {
                queryParams['filter[phone]'] = filter_value;
            } else if (filter_by === 'city') {
                queryParams['filter[city]'] = filter_value;
            } else if (filter_by === 'country') {
                queryParams['filter[country]'] = filter_value;
            } else if (filter_by === 'language') {
                queryParams['filter[language]'] = filter_value;
            } else if (filter_by === 'tag') {
                queryParams['filter[tags]'] = filter_value;
            }
        }

        // Filter by company if specified
        if (company_id) {
            // First get the contacts linked to this company
            const companyInfo = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/companies.info',
                queryParams: {
                    id: company_id
                }
            });

            // If there are no linked contacts, return empty results
            if (!companyInfo?.body?.data?.linked_contacts || companyInfo.body.data.linked_contacts.length === 0) {
                return {
                    data: [],
                    included: {},
                    meta: {
                        pagination: {
                            total: 0,
                            count: 0,
                            per_page: page_size || 20,
                            current_page: page || 1,
                            total_pages: 0
                        }
                    }
                };
            }

            // Get the linked contact IDs
            const linkedContactIds = companyInfo.body.data.linked_contacts.map((contact: any) => contact.id);
            
            // Filter results based on company-linked contacts
            let allContacts = [];
            
            // Search contacts using the filter params
            const response = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/contacts.list',
                queryParams
            });
            
            // Filter the response to only include contacts linked to the specified company
            allContacts = response.body.data.filter((contact: any) => 
                linkedContactIds.includes(contact.id)
            );
            
            // Prepare the response object
            const filteredResponse = {
                ...response.body,
                data: allContacts,
                meta: {
                    ...response.body.meta,
                    pagination: {
                        ...response.body.meta.pagination,
                        total: allContacts.length,
                        count: allContacts.length
                    }
                }
            };
            
            // If we don't need detailed information, return the filtered list
            if (!include_details) {
                return filteredResponse;
            }
            
            // If detailed info is requested, fetch full details for each contact
            const detailedContacts = [];
            
            for (const contact of allContacts) {
                const detailedInfo = await teamleaderCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.GET,
                    resourceUri: '/contacts.info',
                    queryParams: {
                        id: contact.id
                    }
                });
                
                detailedContacts.push(detailedInfo.body.data);
            }
            
            // Return results with detailed information
            return {
                ...filteredResponse,
                data: detailedContacts
            };
        } else {
            // If no company filter, just fetch contacts based on other filters
            const response = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/contacts.list',
                queryParams
            });
            
            // If we don't need detailed information, return the list as is
            if (!include_details) {
                return response.body;
            }
            
            // If detailed info is requested, fetch full details for each contact
            const contacts = response.body.data;
            const detailedContacts = [];
            
            for (const contact of contacts) {
                const detailedInfo = await teamleaderCommon.apiCall({
                    auth: context.auth,
                    method: HttpMethod.GET,
                    resourceUri: '/contacts.info',
                    queryParams: {
                        id: contact.id
                    }
                });
                
                detailedContacts.push(detailedInfo.body.data);
            }
            
            // Return results with pagination info and detailed data
            return {
                ...response.body,
                data: detailedContacts
            };
        }
    },
});
