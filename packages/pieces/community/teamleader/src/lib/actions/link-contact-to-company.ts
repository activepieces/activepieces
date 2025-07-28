import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const linkContactToCompany = createAction({
    name: 'link_contact_to_company',
    displayName: 'Link Contact to Company',
    description: 'Associate a contact with a company in Teamleader',
    auth: teamleaderAuth,
    props: {
        contact_id: Property.Dropdown({
            displayName: 'Contact',
            description: 'The contact to link',
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
        company_id: Property.Dropdown({
            displayName: 'Company',
            description: 'The company to link the contact to',
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
        job_title: Property.ShortText({
            displayName: 'Job Title',
            description: "Contact's position or title in the company",
            required: false
        }),
        decision_maker: Property.Checkbox({
            displayName: 'Decision Maker',
            description: 'Whether this contact is a decision maker in the company',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        // Prepare the link data
        const linkData: Record<string, any> = {
            id: context.propsValue.contact_id,
            company_id: context.propsValue.company_id,
        };

        // Add optional fields if provided
        if (context.propsValue.job_title) {
            linkData['position'] = context.propsValue.job_title;
        }

        if (context.propsValue.decision_maker) {
            linkData['decision_maker'] = context.propsValue.decision_maker;
        }

        // Link contact to company using Teamleader API
        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.link',
            body: linkData
        });

        // Get and return the updated contact data with company information
        const updatedContact = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts.info',
            queryParams: {
                id: context.propsValue.contact_id
            }
        });

        return updatedContact.body;
    },
});
