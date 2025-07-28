import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchDeals = createAction({
    name: 'search_deals',
    displayName: 'Search Deals',
    description: 'List or filter deals',
    auth: teamleaderAuth,
    props: {
        term: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search by title, reference or customer name',
            required: false,
        }),
        customer_type: Property.StaticDropdown({
            displayName: 'Customer Type',
            description: 'Type of customer to filter by',
            required: false,
            options: {
                options: [
                    { label: 'Company', value: 'company' },
                    { label: 'Contact', value: 'contact' }
                ]
            }
        }),
        customer_id: Property.Dropdown({
            displayName: 'Customer',
            description: 'Filter deals by specific customer',
            required: false,
            refreshers: ['customer_type'],
            options: async ({ auth, customer_type }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                if (!customer_type) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select customer type first'
                };

                try {
                    if (customer_type === 'company') {
                        const response = await teamleaderCommon.apiCall({
                            auth: auth as any,
                            method: HttpMethod.POST,
                            resourceUri: '/companies.list',
                            body: {}
                        });

                        return {
                            disabled: false,
                            options: response.body.data.map((company: any) => ({
                                label: company.name,
                                value: company.id
                            }))
                        };
                    } else {
                        const response = await teamleaderCommon.apiCall({
                            auth: auth as any,
                            method: HttpMethod.POST,
                            resourceUri: '/contacts.list',
                            body: {}
                        });

                        return {
                            disabled: false,
                            options: response.body.data.map((contact: any) => ({
                                label: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                                value: contact.id
                            }))
                        };
                    }
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading customers'
                    };
                }
            }
        }),
        phase_id: Property.Dropdown({
            displayName: 'Deal Phase',
            description: 'Filter by deal phase or stage',
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
                        method: HttpMethod.POST,
                        resourceUri: '/dealPhases.list',
                        body: {}
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((phase: any) => ({
                            label: phase.name,
                            value: phase.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading phases'
                    };
                }
            }
        }),
        status: Property.StaticMultiSelectDropdown({
            displayName: 'Status',
            description: 'Filter by deal status (multiple selection)',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'open' },
                    { label: 'Won', value: 'won' },
                    { label: 'Lost', value: 'lost' }
                ]
            }
        }),
        responsible_user_id: Property.Dropdown({
            displayName: 'Responsible User',
            description: 'Filter by user responsible for deals',
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
                        method: HttpMethod.POST,
                        resourceUri: '/users.list',
                        body: {
                            filter: {
                                status: ['active']
                            }
                        }
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((user: any) => ({
                            label: `${user.first_name} ${user.last_name}`,
                            value: user.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading users'
                    };
                }
            }
        }),
        estimated_closing_date: Property.DateTime({
            displayName: 'Exact Closing Date',
            description: 'Filter by specific estimated closing date',
            required: false,
        }),
        estimated_closing_date_from: Property.DateTime({
            displayName: 'Closing Date From',
            description: 'Filter deals closing after this date (inclusive)',
            required: false,
        }),
        estimated_closing_date_until: Property.DateTime({
            displayName: 'Closing Date Until',
            description: 'Filter deals closing before this date (inclusive)',
            required: false,
        }),
        updated_since: Property.DateTime({
            displayName: 'Updated Since',
            description: 'Only deals updated after this date (inclusive)',
            required: false,
        }),
        created_before: Property.DateTime({
            displayName: 'Created Before',
            description: 'Only deals created before this date (inclusive)',
            required: false,
        }),
        sort_field: Property.StaticDropdown({
            displayName: 'Sort Field',
            description: 'Field to sort by',
            required: false,
            options: {
                options: [
                    { label: 'Created Date', value: 'created_at' },
                    { label: 'Weighted Value', value: 'weighted_value' }
                ]
            }
        }),
        sort_order: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'Sort direction',
            required: false,
            options: {
                options: [
                    { label: 'Ascending (Oldest First, Lowest Value)', value: 'asc' },
                    { label: 'Descending (Newest First, Highest Value)', value: 'desc' }
                ]
            }
        }),
        page_size: Property.Number({
            displayName: 'Results Per Page',
            description: 'Number of results per page (default: 20)',
            required: false,
        }),
        page_number: Property.Number({
            displayName: 'Page Number',
            description: 'Page number to retrieve (default: 1)',
            required: false,
        }),
        include_custom_fields: Property.Checkbox({
            displayName: 'Include Custom Fields',
            description: 'Include custom field data in results',
            required: false,
        }),
    },
    async run(context) {
        const requestBody: Record<string, any> = {};

        const filter: Record<string, any> = {};

        if (context.propsValue.term) {
            filter['term'] = context.propsValue.term;
        }

        if (context.propsValue.customer_type && context.propsValue.customer_id) {
            filter['customer'] = {
                type: context.propsValue.customer_type,
                id: context.propsValue.customer_id
            };
        }

        if (context.propsValue.phase_id) {
            filter['phase_id'] = context.propsValue.phase_id;
        }

        if (context.propsValue.status && context.propsValue.status.length > 0) {
            filter['status'] = context.propsValue.status;
        }

        if (context.propsValue.responsible_user_id) {
            filter['responsible_user_id'] = context.propsValue.responsible_user_id;
        }

        if (context.propsValue.estimated_closing_date) {
            const closingDate = new Date(context.propsValue.estimated_closing_date);
            filter['estimated_closing_date'] = closingDate.toISOString().split('T')[0];
        }

        if (context.propsValue.estimated_closing_date_from) {
            const fromDate = new Date(context.propsValue.estimated_closing_date_from);
            filter['estimated_closing_date_from'] = fromDate.toISOString().split('T')[0];
        }

        if (context.propsValue.estimated_closing_date_until) {
            const untilDate = new Date(context.propsValue.estimated_closing_date_until);
            filter['estimated_closing_date_until'] = untilDate.toISOString().split('T')[0];
        }

        if (context.propsValue.updated_since) {
            const updatedSince = new Date(context.propsValue.updated_since);
            filter['updated_since'] = updatedSince.toISOString();
        }

        if (context.propsValue.created_before) {
            const createdBefore = new Date(context.propsValue.created_before);
            filter['created_before'] = createdBefore.toISOString();
        }

        if (Object.keys(filter).length > 0) {
            requestBody['filter'] = filter;
        }

        const page: Record<string, number> = {};

        if (context.propsValue.page_size) {
            page['size'] = context.propsValue.page_size;
        }

        if (context.propsValue.page_number) {
            page['number'] = context.propsValue.page_number;
        }

        if (Object.keys(page).length > 0) {
            requestBody['page'] = page;
        }

        if (context.propsValue.sort_field && context.propsValue.sort_order) {
            requestBody['sort'] = [{
                field: context.propsValue.sort_field,
                order: context.propsValue.sort_order
            }];
        }

        if (context.propsValue.include_custom_fields) {
            requestBody['includes'] = 'custom_fields';
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/deals.list',
            body: requestBody
        });

        return response.body;
    },
});
