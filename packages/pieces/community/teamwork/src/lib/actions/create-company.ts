import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createCompany = createAction({
    name: 'create_company',
    displayName: 'Create Company',
    description: 'Create a new company/client record in Teamwork',
    auth: teamworkAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Company Name',
            description: 'Name of the company',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Company description',
            required: false,
        }),
        website: Property.ShortText({
            displayName: 'Website',
            description: 'Company website URL',
            required: false,
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            description: 'Company phone number',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Company email address',
            required: false,
        }),
        address: Property.LongText({
            displayName: 'Address',
            description: 'Company address',
            required: false,
        }),
    },
    async run(context) {
        const { name, description, website, phone, email, address } = context.propsValue;

        const companyData: any = {
            company: {
                name,
                description: description || '',
                website: website || undefined,
                phone: phone || undefined,
                'email-one': email || undefined,
                'address-one': address || undefined,
            }
        };

        // Remove undefined values
        Object.keys(companyData.company).forEach(key => {
            if (companyData.company[key] === undefined) {
                delete companyData.company[key];
            }
        });

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/companies.json',
            body: companyData,
        });

        return response;
    },
});
