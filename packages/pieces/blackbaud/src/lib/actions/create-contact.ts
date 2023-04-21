import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';

export const blackbaudCreateContactOnEmail = createAction({
    name: 'create_contact_if_not_exists',
    description: 'Create Contact if it does not exist',
    displayName: 'Create Contact Based on Email',
    props: {
        ...blackbaudCommon.auth_props,
        email: Property.ShortText({
            displayName: "Email",
            description: "The email of the contact",
            required: true,
        }),
        contact_json: Property.Json({
            displayName: "Contact (JSON)",
            description: "The Contact JSON",
            defaultValue: {
                "email": {
                    "address": "Kilgore_Trout64@gmail.com",
                    "do_not_email": false,
                    "inactive": false,
                    "primary": true,
                    "type": "Email"
                },
                "first": "Kilgore",
                "last": "Trout",
                "phone": {
                    "do_not_call": false,
                    "inactive": false,
                    "number": "843-537-3397",
                    "primary": true,
                    "type": "Home"
                },
                "address": {
                    "street1": "Street 41",
                    "city": "Calforina",
                    "state": "CA",
                    "zip": "19941",
                    "type": "Business",
                    "country": "USA"
                },
                "type": "Individual"
            },
            required: true
        })
    },
    sampleData: [
        {
            "email": {
                "address": "Kilgore_Trout64@gmail.com",
                "do_not_email": false,
                "inactive": false,
                "primary": true,
                "type": "Email"
            },
            "first": "Kilgore",
            "last": "Trout",
            "phone": {
                "do_not_call": false,
                "inactive": false,
                "number": "843-537-3397",
                "primary": true,
                "type": "Home"
            },
            "address": {
                "street1": "Street 41",
                "city": "Calforina",
                "state": "CA",
                "zip": "19941",
                "type": "Business",
                "country": "USA"
            },
            "type": "Individual"
        }
    ],
    async run(configValue) {
        const accessToken = configValue.propsValue['authentication']?.access_token;
        const duplicatedContact = (await httpClient.sendRequest<{ count: number; }>({
            method: HttpMethod.GET,
            url: `https://api.sky.blackbaud.com/constituent/v1/constituents/search?search_text=${configValue.propsValue['email']}`,
            headers: {
                "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                Authorization: `Bearer ${accessToken}`,
            }
        }));
        if (duplicatedContact.body.count > 0) {
            return {
                message: "Contact already exists"
            }
        }
        return (await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.sky.blackbaud.com/constituent/v1/constituents`,
            body: configValue.propsValue['contact_json'],
            headers: {
                "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                Authorization: `Bearer ${accessToken}`,
            },
        })).body;
    },
});
