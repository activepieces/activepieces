import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';


export const findDeal = createAction({
    auth: zendeskSellAuth,
    name: 'find_deal',
    displayName: 'Find Deal',
    description: 'Look up a deal by ID or name.',
    audience: 'both',
    aiMetadata: { description: 'Looks up a single deal in Zendesk Sell, either by its unique deal ID (a direct fetch, prioritized when provided) or by exact deal name (a search that returns the first match). Use to resolve a deal before updating it or to check whether a named deal exists. Requires at least one of ID or name; returns null data when no match is found. Idempotent — a read-only lookup.', idempotent: true },
    props: {
        deal_id: Property.Number({
            displayName: 'Deal ID',
            description: 'Find a deal by its unique ID. (Prioritized over Name)',
            required: false,
        }),
        deal_name: Property.ShortText({
            displayName: 'Deal Name',
            description: 'Find a deal by its exact name. (Used if Deal ID is not provided)',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { deal_id, deal_name } = propsValue;

        if (!deal_id && !deal_name) {
            throw new Error('Please provide a Deal ID or a Deal Name to find.');
        }


        if (deal_id) {
            const response = await callZendeskApi(
                HttpMethod.GET,
                `v2/deals/${deal_id}`,
                auth
            );
            return response.body;
        }


        if (deal_name) {
            const requestBody = {
                "items": [
                    {
                        "data": {
                            "query": {
                                "filter": {
                                    "filter": {
                                        "attribute": { "name": "name" },
                                        "parameter": { "eq": deal_name }
                                    }
                                }
                            }
                        },
                        "per_page": 1 
                    }
                ]
            };

            const response = await callZendeskApi(
                HttpMethod.POST,
                'v3/deals/search',
                auth,
                requestBody
            );

            const searchResponse = response.body as { items: { data: Record<string, unknown> }[] };
            
            if (searchResponse.items && searchResponse.items.length > 0) {
                return { data: searchResponse.items[0].data };
            } else {
                return { data: null };
            }
        }


        return { data: null };
    },
});