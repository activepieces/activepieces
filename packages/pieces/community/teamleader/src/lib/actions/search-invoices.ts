import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchInvoices = createAction({
    name: 'search_invoices',
    displayName: 'Search Invoices',
    description: 'List or filter invoices in Teamleader',
    auth: teamleaderAuth,
    props: {
        filter_by: Property.StaticDropdown({
            displayName: 'Filter By',
            description: 'Choose how to filter invoices',
            required: false,
            options: {
                options: [
                    { label: 'No Filter (List All)', value: 'none' },
                    { label: 'Invoice Number', value: 'number' },
                    { label: 'Reference', value: 'reference' },
                    { label: 'Status', value: 'status' }
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
            description: 'Filter invoices by their status',
            required: false,
            options: {
                options: [
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Sent', value: 'sent' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Overdue', value: 'overdue' }
                ]
            },
            defaultValue: 'all'
        }),
        company_id: Property.Dropdown({
            displayName: 'Filter By Company',
            description: 'Filter invoices by their associated company',
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
            description: 'Filter invoices by their associated contact',
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
        min_total: Property.Number({
            displayName: 'Minimum Invoice Total',
            description: 'Filter invoices by minimum total amount',
            required: false,
        }),
        max_total: Property.Number({
            displayName: 'Maximum Invoice Total',
            description: 'Filter invoices by maximum total amount',
            required: false,
        }),
        date_from: Property.DateTime({
            displayName: 'Invoice Date From',
            description: 'Filter invoices with date after this date',
            required: false,
        }),
        date_to: Property.DateTime({
            displayName: 'Invoice Date To',
            description: 'Filter invoices with date before this date',
            required: false,
        }),
        due_date_from: Property.DateTime({
            displayName: 'Due Date From',
            description: 'Filter invoices with due date after this date',
            required: false,
        }),
        due_date_to: Property.DateTime({
            displayName: 'Due Date To',
            description: 'Filter invoices with due date before this date',
            required: false,
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Choose field to sort results by',
            required: false,
            options: {
                options: [
                    { label: 'Invoice Number (Ascending)', value: 'number' },
                    { label: 'Invoice Number (Descending)', value: '-number' },
                    { label: 'Invoice Date (Newest First)', value: '-date' },
                    { label: 'Invoice Date (Oldest First)', value: 'date' },
                    { label: 'Due Date (Earliest First)', value: 'due_on' },
                    { label: 'Due Date (Latest First)', value: '-due_on' },
                    { label: 'Total (Low to High)', value: 'total' },
                    { label: 'Total (High to Low)', value: '-total' },
                    { label: 'Created (Newest First)', value: '-created_at' },
                    { label: 'Created (Oldest First)', value: 'created_at' },
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
            description: 'Fetch detailed information for each invoice',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const { 
            filter_by, filter_value, status_filter, company_id, contact_id,
            min_total, max_total, date_from, date_to, due_date_from, due_date_to,
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
            if (filter_by === 'number') {
                queryParams['filter[number]'] = filter_value;
            } else if (filter_by === 'reference') {
                queryParams['filter[reference]'] = filter_value;
            }
        }

        // Add status filter
        if ((filter_by === 'status' && filter_value) || (status_filter && status_filter !== 'all')) {
            // If both status filters are provided, prefer the filter_value from the filter_by dropdown
            const statusValue = (filter_by === 'status' && filter_value) ? filter_value : status_filter;
            if (statusValue) {
                queryParams['filter[status]'] = statusValue;
            }
        }

        // Add total amount range filters
        if (min_total !== undefined && min_total !== null) {
            queryParams['filter[min_total]'] = min_total.toString();
        }
        
        if (max_total !== undefined && max_total !== null) {
            queryParams['filter[max_total]'] = max_total.toString();
        }

        // Add invoice date range filters
        if (date_from) {
            const fromDate = new Date(date_from);
            const formattedFromDate = fromDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[date_from]'] = formattedFromDate;
        }
        
        if (date_to) {
            const toDate = new Date(date_to);
            const formattedToDate = toDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[date_to]'] = formattedToDate;
        }

        // Add due date range filters
        if (due_date_from) {
            const fromDueDate = new Date(due_date_from);
            const formattedFromDueDate = fromDueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[due_date_from]'] = formattedFromDueDate;
        }
        
        if (due_date_to) {
            const toDueDate = new Date(due_date_to);
            const formattedToDueDate = toDueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            queryParams['filter[due_date_to]'] = formattedToDueDate;
        }

        // Add customer (company or contact) filters to the API query directly
        if (company_id) {
            queryParams['filter[contact_type]'] = 'company';
            queryParams['filter[contact_id]'] = company_id;
        } else if (contact_id) {
            queryParams['filter[contact_type]'] = 'contact';
            queryParams['filter[contact_id]'] = contact_id;
        }
        
        // Get all invoices using the filters
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/invoices.list',
            queryParams
        });

        // If we don't need detailed information, return the response as is
        if (!include_details) {
            return response.body;
        }
        
        // If detailed info is requested, fetch full details for each invoice
        const invoices = response.body.data;
        const detailedInvoices = [];
        
        for (const invoice of invoices) {
            const detailedInfo = await teamleaderCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: '/invoices.info',
                queryParams: {
                    id: invoice.id
                }
            });
            
            detailedInvoices.push(detailedInfo.body.data);
        }
        
        // Return results with detailed information
        return {
            ...response.body,
            data: detailedInvoices
        };
    },
});
