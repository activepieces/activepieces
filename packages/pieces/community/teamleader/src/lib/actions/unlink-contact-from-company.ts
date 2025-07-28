import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamleaderAuth } from '../common/auth';
import { teamleaderCommon } from '../common/client';

export const unlinkContactFromCompany = createAction({
    name: 'unlink_contact_from_company',
    displayName: 'Unlink Contact from Company',
    description: 'Remove the association between a contact and a company in Teamleader',
    auth: teamleaderAuth,
    props: {
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'ID of the contact to unlink',
            required: true,
        }),
        company_id: Property.ShortText({
            displayName: 'Company ID',
            description: 'ID of the company to unlink from the contact',
            required: true,
        }),
    },
    async run(context) {
        const { contact_id, company_id } = context.propsValue;
        
        // Call Teamleader API to unlink contact from company
        const response = await teamleaderCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/relationshipCompanyContact.delete',
            body: {
                id: {
                    contact: {
                        type: 'contact',
                        id: contact_id
                    },
                    company: {
                        type: 'company',
                        id: company_id
                    }
                }
            }
        });

        // Return the successful response
        return {
            success: true,
            message: 'Contact successfully unlinked from company',
            response: response.body
        };
    },
});
