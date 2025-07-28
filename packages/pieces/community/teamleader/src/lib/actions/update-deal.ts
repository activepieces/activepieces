import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const updateDeal = createAction({
    name: 'update_deal',
    displayName: 'Update Deal',
    description: 'Update an existing deal in Teamleader',
    auth: teamleaderAuth,
    props: {
        deal_id: Property.Dropdown({
            displayName: 'Deal',
            description: 'The deal to update',
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
                        resourceUri: '/deals.list'
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
        title: Property.ShortText({
            displayName: 'Deal Title',
            description: 'Title of the deal',
            required: false,
        }),
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'The company associated with this deal',
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
            displayName: 'Contact Person',
            description: 'Contact person for this deal',
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
        const { deal_id, ...updateFields } = context.propsValue;
        
        // Initialize the update object
        const dealUpdate: Record<string, any> = {
            id: deal_id,
        };

        // Add optional fields if they are provided
        if (updateFields.title) {
            dealUpdate['title'] = updateFields.title;
        }
        
        if (updateFields.company_id) {
            dealUpdate['company'] = {
                type: 'company',
                id: updateFields.company_id
            };
        }
        
        if (updateFields.contact_id) {
            dealUpdate['contact'] = {
                type: 'contact',
                id: updateFields.contact_id
            };
        }

        if (updateFields.estimated_value) {
            dealUpdate['estimated_value'] = {
                amount: updateFields.estimated_value,
                currency: 'EUR' // Default currency, could be made configurable
            };
        }

        if (updateFields.estimated_probability) {
            dealUpdate['estimated_probability'] = updateFields.estimated_probability;
        }

        if (updateFields.estimated_closing_date) {
            // Format date as YYYY-MM-DD using ISO string for better compatibility
            const closingDate = new Date(updateFields.estimated_closing_date);
            const formattedDate = closingDate.toISOString().split('T')[0];
            dealUpdate['estimated_closing_date'] = formattedDate;
        }

        if (updateFields.source) {
            dealUpdate['source'] = updateFields.source;
        }

        if (updateFields.department_id) {
            dealUpdate['department'] = {
                type: 'department',
                id: updateFields.department_id
            };
        }

        if (updateFields.responsible_user_id) {
            dealUpdate['responsible_user'] = {
                type: 'user',
                id: updateFields.responsible_user_id
            };
        }

        if (updateFields.description) {
            dealUpdate['description'] = updateFields.description;
        }

        // Update deal using Teamleader API
        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/deals.update',
            body: dealUpdate
        });

        // Get the updated deal details
        const dealInfo = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/deals.info',
            queryParams: {
                id: deal_id as string
            }
        });

        return dealInfo.body;
    },
});
