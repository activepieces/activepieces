import { createAction, httpClient, HttpMethod, HttpRequest } from '@activepieces/framework';
import { blackbaudCommon } from '../common/common';


export const blackbaudListContacts = createAction({
    name: 'list_contacts',
    description: 'List all contacts on blackbaud, this could take while',
    displayName: 'List All Contacts',
    props: {
        ...blackbaudCommon.auth_props,
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
        let contacts: any[] = [];
        let nextLink: string | undefined = `${blackbaudCommon.baseUrl}/constituent/v1/constituents?limit=500`;
        while (nextLink !== undefined) {
            const request: HttpRequest = {
                method: HttpMethod.GET,
                url: nextLink,
                headers: {
                    "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            const response = await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>(request);
            contacts = contacts.concat(response.body?.value)
            nextLink = response.body?.next_link;
        }
        return contacts;
    },
});
