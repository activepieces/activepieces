import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const unlinkContactFromCompany = createAction({
    name: 'unlink_contact_from_company',
    displayName: 'Unlink Contact from Company',
    description: 'Remove the association between contact and company',
    auth: teamleaderAuth,
    props: {
        contact_id: Property.Dropdown({
            displayName: 'Contact',
            description: 'Select the contact to unlink',
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
            description: 'Select the company to unlink from',
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
    },
    async run(context) {
        await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/contacts.unlinkFromCompany',
            body: {
                id: context.propsValue.contact_id,
                company_id: context.propsValue.company_id
            }
        });

        return {
            success: true,
            message: 'Contact unlinked from company successfully',
            contact_id: context.propsValue.contact_id,
            company_id: context.propsValue.company_id
        };
    },
});
