import { createAction, httpClient, HttpMethod, HttpRequest, Property } from '@activepieces/framework';
import { blackbaudCommon } from '../common/common';


export const blackbaudSearchAfterDate = createAction({
    name: 'search_contacts_after_date',
    description: 'Search contacts',
    displayName: 'Search Contacts After Date',
    props: {
        ...blackbaudCommon.auth_props,
        last_modified_date: Property.ShortText({
            displayName: "Last Modified Date",
            description: "The date to search for contacts modified after",
            defaultValue: "2021-01-01T00:00:00.000Z",
            required: true
        })
    },
    sampleData: [
        {
            "id": "597747",
            "address": {
                "id": "821363",
                "address_lines": "1600 Amphitheatre Pkwy",
                "city": "Mountain View",
                "constituent_id": "597747",
                "country": "United States",
                "do_not_mail": false,
                "formatted_address": "1600 Amphitheatre Pkwy\r\nMountain View,   94043",
                "inactive": false,
                "postal_code": "94043",
                "preferred": true,
                "type": "Home"
            }
        }
    ],
    async run(configValue) {
        const accessToken = configValue.propsValue['authentication']?.access_token;
        return (await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>({
            method: HttpMethod.GET,
            url: `https://api.sky.blackbaud.com/constituent/v1/constituents?limit=1000&sort=date_modified&last_modified_date=${configValue.propsValue['last_modified_date']}`,
            headers: {
                "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                Authorization: `Bearer ${accessToken}`,
            },
        })).body.value;
    },
});
