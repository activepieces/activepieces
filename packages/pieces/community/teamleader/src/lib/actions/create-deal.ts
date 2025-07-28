import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createDeal = createAction({
    name: 'create_deal',
    displayName: 'Create Deal',
    description: 'Create a new deal/opportunity in Teamleader',
    auth: teamleaderAuth,
    props: {
        title: Property.ShortText({
            displayName: 'Deal Title',
            description: 'Title of the deal',
            required: true,
        }),
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'The company associated with this deal',
            required: true,
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
            displayName: 'Contact Person',
            description: 'Optional contact person for this deal',
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

                        if (companyInfo?.body?.linked_contacts) {
                            const linkedContacts = companyInfo.body.linked_contacts;
                            
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
        estimated_value: Property.Number({
            displayName: 'Estimated Value',
            description: 'The estimated value of the deal',
            required: false,
        }),
        estimated_probability: Property.StaticDropdown({
            displayName: 'Estimated Probability',
            description: 'The estimated probability of winning the deal',
            required: false,
            options: {
                options: [
                    { label: '0%', value: 0 },
                    { label: '25%', value: 25 },
                    { label: '50%', value: 50 },
                    { label: '75%', value: 75 },
                    { label: '100%', value: 100 }
                ]
            }
        }),
        estimated_closing_date: Property.DateTime({
            displayName: 'Estimated Closing Date',
            description: 'The estimated date when the deal will close (YYYY-MM-DD)',
            required: false,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'How the lead was acquired',
            required: false,
        }),
        department_id: Property.Dropdown({
            displayName: 'Department',
            description: 'The department responsible for this deal',
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
                        resourceUri: '/departments.list'
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
        responsible_user_id: Property.Dropdown({
            displayName: 'Responsible User',
            description: 'The user responsible for this deal',
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
                        resourceUri: '/users.me'
                    });

                    // Since user permissions may limit access to all users,
                    // just return the authenticated user as an option
                    return {
                        disabled: false,
                        options: [{
                            label: `${response.body.data.first_name} ${response.body.data.last_name}`,
                            value: response.body.data.id
                        }]
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
        description: Property.LongText({
            displayName: 'Description',
            description: 'Additional details about the deal',
            required: false,
        }),
    },
    async run(context) {
        const deal: Record<string, any> = {
            title: context.propsValue.title,
            company: {
                type: 'company',
                id: context.propsValue.company_id
            }
        };

        // Add optional fields if they are provided
        if (context.propsValue.contact_id) {
            deal['contact'] = {
                type: 'contact',
                id: context.propsValue.contact_id
            };
        }

        if (context.propsValue.estimated_value) {
            deal['estimated_value'] = {
                amount: context.propsValue.estimated_value,
                currency: 'EUR' // Default currency, could be made configurable
            };
        }

        if (context.propsValue.estimated_probability) {
            deal['estimated_probability'] = context.propsValue.estimated_probability;
        }

        if (context.propsValue.estimated_closing_date) {
            // Format date as YYYY-MM-DD using ISO string for better compatibility
            const closingDate = new Date(context.propsValue.estimated_closing_date);
            const formattedDate = closingDate.toISOString().split('T')[0];
            deal['estimated_closing_date'] = formattedDate;
        }

        if (context.propsValue.source) {
            deal['source'] = context.propsValue.source;
        }

        if (context.propsValue.department_id) {
            deal['department'] = {
                type: 'department',
                id: context.propsValue.department_id
            };
        }

        if (context.propsValue.responsible_user_id) {
            deal['responsible_user'] = {
                type: 'user',
                id: context.propsValue.responsible_user_id
            };
        }

        if (context.propsValue.description) {
            deal['description'] = context.propsValue.description;
        }

        // Create deal using Teamleader API
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/deals.add',
            body: deal
        });

        // Get the newly created deal details
        const dealInfo = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/deals.info',
            queryParams: {
                id: response.body.data.id
            }
        });

        return dealInfo.body;
    },
});
