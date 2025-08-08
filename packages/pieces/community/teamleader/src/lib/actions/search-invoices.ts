import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const searchInvoices = createAction({
    name: 'search_invoices',
    displayName: 'Search Invoices',
    description: 'List or filter invoices',
    auth: teamleaderAuth,
    props: {
        term: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search by invoice number, purchase order number, payment reference or customer name',
            required: false,
        }),
        invoice_number: Property.ShortText({
            displayName: 'Invoice Number',
            description: 'Filter by full invoice number (e.g., "2017 / 5")',
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
            description: 'Filter invoices by specific customer',
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
        department_id: Property.Dropdown({
            displayName: 'Department',
            description: 'Filter by department (company entity)',
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
                        resourceUri: '/departments.list',
                        body: {
                            filter: {
                                status: ['active']
                            }
                        }
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((department: any) => ({
                            label: department.name,
                            value: department.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading departments'
                    };
                }
            }
        }),
        deal_id: Property.Dropdown({
            displayName: 'Deal',
            description: 'Filter by associated deal',
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
                        resourceUri: '/deals.list',
                        body: {}
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((deal: any) => ({
                            label: deal.title,
                            value: deal.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading deals'
                    };
                }
            }
        }),
        project_id: Property.Dropdown({
            displayName: 'Project',
            description: 'Filter by associated project',
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
                        resourceUri: '/projects.list',
                        body: {}
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((project: any) => ({
                            label: project.title,
                            value: project.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading projects'
                    };
                }
            }
        }),
        subscription_id: Property.Dropdown({
            displayName: 'Subscription',
            description: 'Filter by associated subscription',
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
                        resourceUri: '/subscriptions.list',
                        body: {}
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((subscription: any) => ({
                            label: subscription.title || subscription.reference,
                            value: subscription.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading subscriptions'
                    };
                }
            }
        }),
        status: Property.StaticMultiSelectDropdown({
            displayName: 'Status',
            description: 'Filter by invoice status (multiple selection)',
            required: false,
            options: {
                options: [
                    { label: 'Draft', value: 'draft' },
                    { label: 'Outstanding', value: 'outstanding' },
                    { label: 'Matched', value: 'matched' }
                ]
            }
        }),
        purchase_order_number: Property.ShortText({
            displayName: 'Purchase Order Number',
            description: 'Filter by purchase order number',
            required: false,
        }),
        payment_reference: Property.ShortText({
            displayName: 'Payment Reference',
            description: 'Filter by payment reference',
            required: false,
        }),
        invoice_date_after: Property.DateTime({
            displayName: 'Invoice Date After',
            description: 'Filter invoices with date after this date (inclusive)',
            required: false,
        }),
        invoice_date_before: Property.DateTime({
            displayName: 'Invoice Date Before',
            description: 'Filter invoices with date before this date (inclusive)',
            required: false,
        }),
        updated_since: Property.DateTime({
            displayName: 'Updated Since',
            description: 'Only invoices updated after this date',
            required: false,
        }),
        sort_field: Property.StaticDropdown({
            displayName: 'Sort Field',
            description: 'Field to sort by',
            required: false,
            options: {
                options: [
                    { label: 'Invoice Number', value: 'invoice_number' },
                    { label: 'Invoice Date', value: 'invoice_date' }
                ]
            }
        }),
        sort_order: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'Sort direction',
            required: false,
            options: {
                options: [
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' }
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
        include_late_fees: Property.Checkbox({
            displayName: 'Include Late Fee Information',
            description: 'Include late fee and interest calculations in response',
            required: false,
        }),
    },
    async run(context) {
        const requestBody: Record<string, any> = {};

        const filter: Record<string, any> = {};

        if (context.propsValue.term) {
            filter['term'] = context.propsValue.term;
        }

        if (context.propsValue.invoice_number) {
            filter['invoice_number'] = context.propsValue.invoice_number;
        }

        if (context.propsValue.customer_type && context.propsValue.customer_id) {
            filter['customer'] = {
                type: context.propsValue.customer_type,
                id: context.propsValue.customer_id
            };
        }

        if (context.propsValue.department_id) {
            filter['department_id'] = context.propsValue.department_id;
        }

        if (context.propsValue.deal_id) {
            filter['deal_id'] = context.propsValue.deal_id;
        }

        if (context.propsValue.project_id) {
            filter['project_id'] = context.propsValue.project_id;
        }

        if (context.propsValue.subscription_id) {
            filter['subscription_id'] = context.propsValue.subscription_id;
        }

        if (context.propsValue.status && context.propsValue.status.length > 0) {
            filter['status'] = context.propsValue.status;
        }

        if (context.propsValue.purchase_order_number) {
            filter['purchase_order_number'] = context.propsValue.purchase_order_number;
        }

        if (context.propsValue.payment_reference) {
            filter['payment_reference'] = context.propsValue.payment_reference;
        }

        if (context.propsValue.invoice_date_after) {
            const afterDate = new Date(context.propsValue.invoice_date_after);
            filter['invoice_date_after'] = afterDate.toISOString().split('T')[0];
        }

        if (context.propsValue.invoice_date_before) {
            const beforeDate = new Date(context.propsValue.invoice_date_before);
            filter['invoice_date_before'] = beforeDate.toISOString().split('T')[0];
        }

        if (context.propsValue.updated_since) {
            const updatedSince = new Date(context.propsValue.updated_since);
            filter['updated_since'] = updatedSince.toISOString();
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

        if (context.propsValue.include_late_fees) {
            requestBody['includes'] = 'late_fees';
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/invoices.list',
            body: requestBody
        });

        return response.body;
    },
});
