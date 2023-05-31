import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';


export const blackbaudGetFundraisingList = createAction({
    name: 'get_fundraising_list',
    description: 'Get Fundraising List',
    displayName: 'Get Fundraising List',
    props: {
        ...blackbaudCommon.auth_props,
        fundraiser_list: blackbaudCommon.fundraiser_list,
        last_modified_date: Property.ShortText({
            displayName: "Last Modified Date",
            description: "The date to search for appeal modified after | 2021-01-01T00:00:00.000Z",
            required: false
        }),
        date_added: Property.ShortText({
            displayName: "Date added",
            description: "The date to search for contacts modified after | 2021-01-01T00:00:00.000Z",
            required: false
        }),
        sort_token: Property.ShortText({
            displayName: "Sort token",
            description: "Represents a token filter to provide the next stable-sorted list of appeals",
            required: false
        }),
        include_inactive: Property.Checkbox({
            displayName: "Include inactive",
            description: "Include inactive appeals in the response",
            defaultValue: false,
            required: true,
        }),
        limit: Property.Number({
            displayName: "Limit",
            description: "Represents the number of records to return. The default is 500. The maximum is 5000",
            required: false,
        })
    },
    sampleData: [
        {
            "count": 1,
            "value": [
                {
                    "id": "1",
                    "category": "Annual",
                    "date_added": "1999-06-25T11:59:57+00:00",
                    "date_modified": "2007-06-18T14:44:52.623+00:00",
                    "description": "Annual Newsletter",
                    "goal": {
                        "value": 250000
                    },
                    "inactive": false,
                    "lookup_id": "NEWSLETTER"
                }
            ]
        }
    ],
    async run(configValue) {
        const { authentication, last_modified_date, date_added, include_inactive, limit, sort_token, subscription_key, fundraiser_list } = configValue.propsValue;
        const accessToken = authentication?.access_token;
        let url = `https://api.sky.blackbaud.com/fundraising/v1/${fundraiser_list}?include_inactive=${include_inactive}`;
        if(last_modified_date) url += `&last_modified=${last_modified_date}`;
        if(date_added) url += `&date_added=${date_added}`;
        if(sort_token) url += `&sort_token=${sort_token}`;
        if(limit) url += `&limit=${limit}`;
        return (await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>({
            method: HttpMethod.GET,
            url,
            headers: {
                "Bb-Api-Subscription-Key": subscription_key,
                Authorization: `Bearer ${accessToken}`,
            },
        })).body.value;
    },
});
