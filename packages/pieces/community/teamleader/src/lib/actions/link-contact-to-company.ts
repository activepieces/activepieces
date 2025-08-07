import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const linkContactToCompany = createAction({
    name: 'link_contact_to_company',
    displayName: 'Link Contact to Company',
    description: 'Associate a contact with a company',
    auth: teamleaderAuth,
    props: {
        contact_id: Property.Dropdown({
            displayName: 'Contact',
            description: 'Select the contact to link',
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
            description: 'Select the company to link to',
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
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading companies'
                    };
                }
            }
        }),
        position: Property.ShortText({
            displayName: 'Position',
            description: 'Job title or role (e.g., CEO, Manager)',
            required: false
        }),
        decision_maker: Property.Checkbox({
            displayName: 'Decision Maker',
            description: 'Is this contact a decision maker?',
            required: false
        })
    },
    async run(context) {
        const linkData: Record<string, any> = {
            id: context.propsValue.contact_id,
            company_id: context.propsValue.company_id,
        };

        if (context.propsValue.position) {
            linkData['position'] = context.propsValue.position;
        }

        if (context.propsValue.decision_maker !== undefined) {
            linkData['decision_maker'] = context.propsValue.decision_maker;
        }

        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.linkToCompany',
            body: linkData
        });

        return {
            success: true,
            message: 'Contact linked to company successfully',
            contact_id: context.propsValue.contact_id,
            company_id: context.propsValue.company_id
        };
    },
});
