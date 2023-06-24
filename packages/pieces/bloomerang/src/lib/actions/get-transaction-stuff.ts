import { Property, createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../../';

export const bloomerangGetTransactionStuff = createAction({
    auth: bloomerangAuth,
    action: {
        name: 'get_transaction_stuff',
        description: 'Get Transaction Stuff',
        displayName: 'Get Transaction Stuff (Advanced)',
        props: {
            transaction_stuff: bloomerangCommon.transaction_stuff,
            skip: Property.Number({
                displayName: "The number of items to skip",
                description: "The number of items to skip before starting to collect the result set.",
                required: false
            }),
            take: Property.Number({
                displayName: "The number of items to include",
                description: "The number of items to include in the result set.",
                required: false
            }),
            id: Property.Array({
                displayName: "IDs list",
                description: "Filters to object with the IDs in the list (pipe-separated)",
                required: false
            }),
            include_inactive: Property.Checkbox({
                displayName: "Filters to either active or inactive funds",
                description: "Filters to either active or inactive funds",
                defaultValue: false,
                required: false,
            }),
            has_goal: Property.Checkbox({
                displayName: "Filters to campaigns",
                description: "Filters to campaigns that have either non-zero-dollar or zero-dollar goals",
                defaultValue: false,
                required: false,
            }),
            limit: Property.ShortText({
                displayName: "Filters to funds with names",
                description: "Filters to funds with names that match any part of the search string",
                required: false,
            })
        },
        async run({ auth, propsValue }) {
            const { transaction_stuff, skip , limit, take, id, include_inactive, has_goal} = propsValue
            let url = `${bloomerangCommon.baseUrl}/${transaction_stuff}?`
            if(transaction_stuff === 'campaigns' && has_goal) url += `hasGoal=${has_goal}&`;
            if(skip) url += `skip=${skip}&`;
            if(limit) url += `limit=${limit}`;
            if(take) url += `take=${take}`;
            if(include_inactive) url += `isActive=${include_inactive}`;
            if(id && id.length > 0) {
                const parserId = id.map(el => `id=${el}`)
                url += parserId.join('&')
            }
            return (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url,
                headers: {
                    "X-API-KEY": auth,
                },
            })).body;
        },
    },
});

