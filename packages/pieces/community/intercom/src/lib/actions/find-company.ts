import { intercomAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const findCompanyAction = createAction({
    auth: intercomAuth,
    name: 'find-company',
    displayName: 'Find Company',
    description: 'Finds an existing company.',
    props: {
        searchField: Property.StaticDropdown({
            displayName: 'Search Field',
            required: true,
            options: {
                disabled: false,
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'Company ID', value: 'company_id' },
                ],
            },
        }),
        searchValue: Property.ShortText({
            displayName: 'Search Value',
            required: true,
        }),
    },
    async run(context) {
        const { searchField, searchValue } = context.propsValue;

        const client = intercomClient(context.auth);

        const companyResponse = await client.companies.retrieve({
            company_id: searchField === 'company_id' ? searchValue : undefined,
            name: searchField === 'name' ? searchValue : undefined,
            per_page:1

        })

        return {
            found: companyResponse.data.length > 0,
            user: companyResponse.data.length > 0 ? companyResponse.data[0] : {},
        };
    },
});
