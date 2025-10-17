import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const findCompany = createAction({
    auth: zendeskSellAuth,
    name: 'find_company',
    displayName: 'Find Company',
    description: 'Finds a company by ID or name.',
    props: {
        search_method: Property.StaticDropdown({
            displayName: 'Search Method',
            required: true,
            options: {
                options: [
                    { label: 'Find by ID', value: 'id' },
                    { label: 'Find by Name', value: 'name' },
                ]
            }
        }),
        search_value: Property.DynamicProperties({
            displayName: 'Search Value',
            required: true,
            refreshers: ['search_method'],
            props: async (propsValue) => {
                const search_method = propsValue['search_method'] as unknown as string;
                const fields: any = {};

                if (search_method === 'id') {
                    fields.company_id = zendeskSellCommon.company(true);
                } else if (search_method === 'name') {
                    fields.name = Property.ShortText({
                        displayName: 'Company Name',
                        description: 'The name of the company to find.',
                        required: true,
                    });
                }
                return fields;
            }
        }),
        fail_on_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the step will fail if no company is found.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        let companyData = null;

        if (propsValue.search_method === 'id') {
            const companyId = (propsValue.search_value as any).company_id;
            try {
                const response = await callZendeskApi<{ data: unknown }>(HttpMethod.GET, `v2/companies/${companyId}`, auth as ZendeskSellAuth);
                companyData = response.body?.data;
            } catch (error: any) {
                if (error.response?.status !== 404) throw error;
            }
        } else { 
            const companyName = (propsValue.search_value as any).name;
            

            const searchBody = {
                query: {
                    filter: {
                        and: [
                            { filter: { attribute: { name: "name" }, parameter: { starts_with: companyName } } },
                            { filter: { attribute: { name: "is_organization" }, parameter: { eq: true } } }
                        ]
                    }
                },
                per_page: 1
            };

            const response = await callZendeskApi<{ items: { data: unknown }[] }>(
                HttpMethod.POST, 'v3/contacts/search', auth as ZendeskSellAuth, searchBody
            );
            
            if (response.body.items.length > 0) {
                companyData = response.body.items[0].data;
            }
        }

        if (!companyData && propsValue.fail_on_not_found) {
            throw new Error(`Company not found.`);
        }

        return companyData;
    },
});