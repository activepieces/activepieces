import { createAction, Property } from '@activepieces/framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';


export const blackbaudUpdateContact = createAction({
    name: 'update_contact',
    description: 'Update a contact',
    displayName: 'Update Contact',
    props: {
        ...blackbaudCommon.auth_props,
        contact_id: Property.ShortText({
            displayName: "Contact ID",
            description: "The Contact ID",
            required: true,
        }),
        contact_json: Property.Json({
            displayName: "Contact (JSON)",
            description: "The Contact JSON",
            defaultValue: {
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
            },
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
        return (await httpClient.sendRequest({
            method: HttpMethod.PATCH,
            url: `https://api.sky.blackbaud.com/constituent/v1/constituents/${configValue.propsValue['contact_id']}`,
            body: configValue.propsValue['contact_json'],
            headers: {
                "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                Authorization: `Bearer ${accessToken}`,
            },
        })).body;
    },
});
