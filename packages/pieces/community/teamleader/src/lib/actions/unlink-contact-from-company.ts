import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const unlinkContactFromCompany = createAction({
    name: 'unlink_contact_from_company',
    displayName: 'Unlink Contact from Company',
    description: 'Remove the association between contact and company',
    audience: 'both',
    aiMetadata: { description: 'Remove the link between a contact and a company in Teamleader without deleting either record. Use to undo a Link Contact to Company association. Requires contact ID and company ID. Idempotent: if the link is already absent, re-running leaves them unlinked.', idempotent: true },
    auth: teamleaderAuth,
    props: {
        contact_id: Property.Dropdown({
          auth:teamleaderAuth,
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
                        auth,
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
          auth:teamleaderAuth,
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
                        auth,
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
