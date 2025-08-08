import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const createDeal = createAction({
    name: 'create_deal',
    displayName: 'Create Deal',
    description: 'Create a new deal/opportunity',
    auth: teamleaderAuth,
    props: {
        title: Property.ShortText({
            displayName: 'Deal Title',
            description: 'Title of the deal',
            required: true,
        }),
        customer_type: Property.StaticDropdown({
            displayName: 'Customer Type',
            description: 'Type of customer for this deal',
            required: true,
            options: {
                options: [
                    { label: 'Company', value: 'company' },
                    { label: 'Contact', value: 'contact' }
                ]
            }
        }),
        customer_id: Property.Dropdown({
            displayName: 'Customer',
            description: 'Select the customer (company or contact)',
            required: true,
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
        contact_person_id: Property.Dropdown({
            displayName: 'Contact Person',
            description: 'Contact person for this deal (for company customers)',
            required: false,
            refreshers: ['customer_type', 'customer_id'],
            options: async ({ auth, customer_type, customer_id }) => {
                if (!auth) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first'
                };

                if (customer_type !== 'company' || !customer_id) return {
                    disabled: true,
                    options: [],
                    placeholder: 'Only available for company customers'
                };

                try {
                    const response = await teamleaderCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.POST,
                        resourceUri: '/companies.info',
                        body: {
                            id: customer_id,
                            includes: 'related_contacts'
                        }
                    });

                    const relatedContacts = response.body.data.related_contacts || [];
                    return {
                        disabled: false,
                        options: relatedContacts.map((contact: any) => ({
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
        summary: Property.LongText({
            displayName: 'Summary',
            description: 'Additional information about the deal',
            required: false,
        }),
        source_id: Property.Dropdown({
            displayName: 'Source',
            description: 'How the lead was acquired',
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
                        resourceUri: '/dealSources.list',
                        body: {}
                    });

                    return {
                        disabled: false,
                        options: response.body.data.map((source: any) => ({
                            label: source.name,
                            value: source.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading sources'
                    };
                }
            }
        }),
        department_id: Property.Dropdown({
            displayName: 'Department',
            description: 'Department responsible for this deal',
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
        responsible_user_id: Property.Dropdown({
            displayName: 'Responsible User',
            description: 'User responsible for this deal',
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
        phase_id: Property.Dropdown({
            displayName: 'Phase',
            description: 'Deal phase or stage',
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
        estimated_value_amount: Property.Number({
            displayName: 'Estimated Value',
            description: 'Deal value amount',
            required: false,
        }),
        estimated_value_currency: Property.StaticDropdown({
            displayName: 'Value Currency',
            description: 'Currency for the estimated value',
            required: false,
            options: {
                options: [
                    { label: 'Euro (EUR)', value: 'EUR' },
                    { label: 'US Dollar (USD)', value: 'USD' },
                    { label: 'British Pound (GBP)', value: 'GBP' },
                    { label: 'Canadian Dollar (CAD)', value: 'CAD' },
                    { label: 'Swiss Franc (CHF)', value: 'CHF' },
                    { label: 'Danish Krone (DKK)', value: 'DKK' },
                    { label: 'Norwegian Krone (NOK)', value: 'NOK' },
                    { label: 'Swedish Krona (SEK)', value: 'SEK' },
                    { label: 'Japanese Yen (JPY)', value: 'JPY' },
                    { label: 'Chinese Yuan (CNY)', value: 'CNY' }
                ]
            }
        }),
        estimated_probability: Property.Number({
            displayName: 'Estimated Probability',
            description: 'Win probability (0-1, e.g., 0.75 for 75%)',
            required: false,
        }),
        estimated_closing_date: Property.DateTime({
            displayName: 'Estimated Closing Date',
            description: 'Expected deal closing date',
            required: false,
        }),
        custom_fields: Property.Array({
            displayName: 'Custom Fields',
            description: 'Custom field values',
            required: false,
            properties: {
                id: Property.ShortText({
                    displayName: 'Field ID',
                    description: 'Custom field identifier',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'Field value',
                    required: true,
                })
            }
        }),
    },
    async run(context) {
        const deal: Record<string, any> = {
            lead: {
                customer: {
                    type: context.propsValue.customer_type,
                    id: context.propsValue.customer_id
                }
            },
            title: context.propsValue.title
        };

        if (context.propsValue.contact_person_id) {
            deal['lead']['contact_person_id'] = context.propsValue.contact_person_id;
        }

        if (context.propsValue.summary) deal['summary'] = context.propsValue.summary;
        if (context.propsValue.source_id) deal['source_id'] = context.propsValue.source_id;
        if (context.propsValue.department_id) deal['department_id'] = context.propsValue.department_id;
        if (context.propsValue.responsible_user_id) deal['responsible_user_id'] = context.propsValue.responsible_user_id;
        if (context.propsValue.phase_id) deal['phase_id'] = context.propsValue.phase_id;

        if (context.propsValue.estimated_value_amount && context.propsValue.estimated_value_currency) {
            deal['estimated_value'] = {
                amount: context.propsValue.estimated_value_amount,
                currency: context.propsValue.estimated_value_currency
            };
        }

        if (context.propsValue.estimated_probability !== undefined) {
            deal['estimated_probability'] = context.propsValue.estimated_probability;
        }

        if (context.propsValue.estimated_closing_date) {
            const closingDate = new Date(context.propsValue.estimated_closing_date);
            deal['estimated_closing_date'] = closingDate.toISOString().split('T')[0];
        }

        if (context.propsValue.custom_fields && context.propsValue.custom_fields.length > 0) {
            deal['custom_fields'] = context.propsValue.custom_fields.map((fieldObj: any) => ({
                id: fieldObj.id,
                value: fieldObj.value
            }));
        }

        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/deals.create',
            body: deal
        });

        return response.body;
    },
});
