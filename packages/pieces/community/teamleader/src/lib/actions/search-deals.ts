import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchDeals = createAction({
    name: 'search_deals',
    displayName: 'Search Deals',
    description: 'List or filter deals in Teamleader',
    auth: teamleaderAuth,
    props: {
        filter_by: Property.StaticDropdown({
            displayName: 'Filter By',
            description: 'Choose how to filter deals',
            required: false,
            options: {
                options: [
                    { label: 'No Filter (List All)', value: 'none' },
                    { label: 'Title', value: 'title' },
                    { label: 'Status', value: 'status' },
                    { label: 'Source', value: 'source' },
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
        status_filter: Property.StaticDropdown({
            displayName: 'Status Filter',
            description: 'Filter deals by their status',
            required: false,
            options: {
                options: [
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Open', value: 'open' },
                    { label: 'Won', value: 'won' },
                    { label: 'Lost', value: 'lost' }
                ]
            },
            defaultValue: 'all'
        }),
        company_id: Property.Dropdown({
            displayName: 'Filter By Company',
            description: 'Filter deals by their associated company',
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
        contact_id: Property.Dropdown({
            displayName: 'Filter By Contact',
            description: 'Filter deals by their associated contact',
            required: false,
            refreshers: ['company_id'],
            options: async ({ auth, company_id }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                try {
                    // If company_id is provided, try to get associated contacts
                    if (company_id) {
                        const companyInfo = await teamleaderCommon.apiCall({
                            auth: auth as any,
                            method: HttpMethod.GET,
                            resourceUri: '/companies.info',
                            queryParams: {
                                id: company_id as string
                            }
                        });

                        if (companyInfo?.body?.data?.linked_contacts) {
                            const linkedContacts = companyInfo.body.data.linked_contacts;
                            
                            // Return contacts linked to this company
                            return {
                                disabled: false,
                                options: linkedContacts.map((contact: any) => ({
                                    label: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                                    value: contact.id
                                }))
                            };
                        }
                    }
                    
                    // If no company_id or no linked contacts, return all contacts
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: '/contacts.list'
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((contact: any) => ({
                            label: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                            value: contact.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading contacts'
                    };
                }
            }
        }),
        phase: Property.StaticDropdown({
            displayName: 'Deal Phase',
            description: 'Filter deals by their phase/stage',
            required: false,
            options: {
                options: [
                    { label: 'Any Phase', value: 'any' },
                    { label: 'Lead', value: 'lead' },
                    { label: 'Prospect', value: 'prospect' },
                    { label: 'Qualified Lead', value: 'qualified_lead' },
                    { label: 'Negotiation', value: 'negotiation' },
                    { label: 'Contract Sent', value: 'contract_sent' }
                ]
            },
            defaultValue: 'any'
        }),
        min_value: Property.Number({
            displayName: 'Minimum Deal Value',
            description: 'Filter deals by minimum estimated value',
            required: false,
        }),
        max_value: Property.Number({
            displayName: 'Maximum Deal Value',
            description: 'Filter deals by maximum estimated value',
            required: false,
        }),
        min_probability: Property.StaticDropdown({
            displayName: 'Minimum Probability',
            description: 'Filter deals by minimum probability',
            required: false,
            options: {
                options: [
                    { label: 'Any', value: 'any' },
                    { label: '25%', value: '25' },
                    { label: '50%', value: '50' },
                    { label: '75%', value: '75' },
                    { label: '100%', value: '100' }
                ]
            },
            defaultValue: 'any'
        }),
        closing_date_from: Property.DateTime({
            displayName: 'Closing Date From',
            description: 'Filter deals with closing date after this date',
            required: false,
        }),
        closing_date_to: Property.DateTime({
            displayName: 'Closing Date To',
            description: 'Filter deals with closing date before this date',
            required: false,
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Choose field to sort results by',
            required: false,
            options: {
                options: [
                    { label: 'Title (A-Z)', value: 'title' },
                    { label: 'Title (Z-A)', value: '-title' },
                    { label: 'Value (Low to High)', value: 'value' },
                    { label: 'Value (High to Low)', value: '-value' },
                    { label: 'Probability (Low to High)', value: 'probability' },
                    { label: 'Probability (High to Low)', value: '-probability' },
                    { label: 'Closing Date (Earliest First)', value: 'closing_date' },
                    { label: 'Closing Date (Latest First)', value: '-closing_date' },
                    { label: 'Added (Newest First)', value: '-created_at' },
                    { label: 'Added (Oldest First)', value: 'created_at' },
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
            description: 'Fetch detailed information for each deal',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const { 
            filter_by, filter_value, status_filter, company_id, contact_id, phase,
            min_value, max_value, min_probability, closing_date_from, closing_date_to,
            sort_by, page_size, page, include_details 
        } = context.propsValue;
        
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
        
        // Add basic filter parameters
        if (filter_by && filter_by !== 'none' && filter_value) {
            if (filter_by === 'title') {
                queryParams['filter[title]'] = filter_value;
            } else if (filter_by === 'source') {
                queryParams['filter[source]'] = filter_value;
            } else if (filter_by === 'tag') {
                queryParams['filter[tags]'] = filter_value;
            }
        }

        // Add status filter
        if (status_filter && status_filter !== 'all') {
            queryParams['filter[status]'] = status_filter;
        }

        // Add phase filter
        if (phase && phase !== 'any') {
            queryParams['filter[phase]'] = phase;
        }
        
        // Add min probability filter
        if (min_probability && min_probability !== 'any') {
            queryParams['filter[min_probability]'] = min_probability;
        }

        // Add value range filters
        if (min_value !== undefined && min_value !== null) {
            queryParams['filter[min_value]'] = min_value.toString();
        }
        
        if (max_value !== undefined && max_value !== null) {
            queryParams['filter[max_value]'] = max_value.toString();
        }

        // Add closing date range filters
        if (closing_date_from) {
            const fromDate = new Date(closing_date_from);
            const formattedFromDate = fromDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[closing_date_from]'] = formattedFromDate;
        }
        
        if (closing_date_to) {
            const toDate = new Date(closing_date_to);
            const formattedToDate = toDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[closing_date_to]'] = formattedToDate;
        }

        // Get all deals using the filters
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/deals.list',
            queryParams
        });

        // Filter by company or contact if specified
        let filteredDeals = response.body.data;

        // Further filtering based on company association
        if (company_id) {
            filteredDeals = filteredDeals.filter((deal: any) => 
                deal.company && deal.company.id === company_id
            );
        }

        // Further filtering based on contact association
        if (contact_id) {
            filteredDeals = filteredDeals.filter((deal: any) => 
                deal.contact && deal.contact.id === contact_id
            );
        }

        // Update the filtered response
        const filteredResponse = {
            ...response.body,
            data: filteredDeals,
            meta: {
                ...response.body.meta,
                pagination: {
                    ...response.body.meta.pagination,
                    total: filteredDeals.length,
                    count: filteredDeals.length
                }
            }
        };

        // If we don't need detailed information, return the filtered list
        if (!include_details) {
            return filteredResponse;
        }
        
        // If detailed info is requested, fetch full details for each deal
        const detailedDeals = [];
        
        for (const deal of filteredDeals) {
            const detailedInfo = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/deals.info',
                queryParams: {
                    id: deal.id
                }
            });
            
            detailedDeals.push(detailedInfo.body.data);
        }
        
        // Return results with detailed information
        return {
            ...filteredResponse,
            data: detailedDeals
        };
    },
});
