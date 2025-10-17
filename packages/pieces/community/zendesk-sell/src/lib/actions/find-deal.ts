import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';
import { ZendeskSellAuth } from '../common/auth';

export const findDeal = createAction({
    auth: zendeskSellAuth,
    name: 'find_deal',
    displayName: 'Find Deal',
    description: 'Look up a deal by ID or by a filter.',
    props: {
        search_method: Property.StaticDropdown({
            displayName: 'Search Method',
            required: true,
            options: {
                options: [
                    { label: 'Find by ID', value: 'id' },
                    { label: 'Find by Filter', value: 'filter' },
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
                    fields.deal_id = zendeskSellCommon.deal(true);
                } else if (search_method === 'filter') {
                    fields.name = Property.ShortText({
                        displayName: 'Deal Name',
                        description: 'The name of the deal to find (case-sensitive).',
                        required: true,
                    });
                }
                return fields;
            }
        }),
        fail_on_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: 'If checked, the step will fail if no deal is found. If unchecked, it will return empty.',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        let dealData = null;

        if (propsValue.search_method === 'id') {
            const dealId = (propsValue.search_value as any).deal_id;
            try {
                const response = await callZendeskApi<{ data: unknown }>(HttpMethod.GET, `v2/deals/${dealId}`, auth as ZendeskSellAuth);
                dealData = response.body?.data;
            } catch (error: any) {
                if (error.response?.status !== 404) {
                    throw error;
                }
            }
        } else { 
            const dealName = (propsValue.search_value as any).name;
            const searchBody = {
                query: {
                    filter: {
                        filter: {
                            attribute: { name: "name" },
                            parameter: { starts_with: dealName }
                        }
                    }
                },
                per_page: 1
            };

            const response = await callZendeskApi<{ items: { data: unknown }[] }>(
                HttpMethod.POST, 'v3/deals/search', auth as ZendeskSellAuth, searchBody
            );
            
            if (response.body.items.length > 0) {
                dealData = response.body.items[0].data;
            }
        }

        if (!dealData && propsValue.fail_on_not_found) {
            throw new Error(`Deal not found for search term.`);
        }

        return dealData;
    },
});