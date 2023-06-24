import { createAction, Property} from "@activepieces/pieces-framework"
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common"
import { dripCommon } from "../common";
import { dripAuth } from "../../"

export const dripUpsertSubscriberAction = createAction({
    auth: dripAuth,
    action: {
        name: 'upsert_subscriber',
        description: 'Create or Update Subscriber',
        displayName: 'Create or Update Subscriber',
        props: {
            account_id: dripCommon.account_id,
            subscriber: dripCommon.subscriber,
            tags: dripCommon.tags,
            custom_fields: dripCommon.custom_fields,
            first_name: Property.ShortText({ displayName: "First Name", required: false }),
            last_name: Property.ShortText({ displayName: "Last Name", required: false }),
            zip: Property.ShortText({ displayName: 'Zip Code', description: "Postal code in which the subscriber resides", required: false }),
            country: Property.ShortText({ displayName: 'Country', description: "The country in which the subscriber resides", required: false }),
            state: Property.ShortText({ displayName: 'State', description: "The region in which the subscriber resides", required: false }),
            city: Property.ShortText({ displayName: 'City', description: "The city in which the subscriber resides", required: false }),
            phone: Property.ShortText({ displayName: 'Phone', description: "The subscriber's primary phone number", required: false }),
            address: Property.ShortText({ displayName: 'Address', description: "The subscriber's mailing address", required: false }),
        },
        sampleData: {
            "links": {
                "subscribers.account": "https://api.getdrip.com/v2/accounts/{subscribers.account}"
            },
            "subscribers": [
                {
                    "id": "1e0ukqg4yzqo1bxyy18f",
                    "href": "https://api.getdrip.com/v2/AAAAAAA/subscribers/AAAAAAA",
                    "status": "active",
                    "email": "yrdd@ggg.com",
                    "first_name": "joe",
                    "last_name": "doe",
                    "address1": "Iraq,Baghdad",
                    "address2": "Amman,Jordan",
                    "city": "Baghdad",
                    "state": "Baghdad",
                    "zip": "10011",
                    "phone": "079123123123",
                    "country": "Iraq",
                    "time_zone": "Baghdad GMT+3",
                    "utc_offset": 3,
                    "visitor_uuid": null,
                    "custom_fields": {},
                    "tags": [],
                    "created_at": "2023-01-30T07:42:12Z",
                    "ip_address": "000.000.00",
                    "user_agent": "Mozilla Firefox",
                    "lifetime_value": null,
                    "original_referrer": null,
                    "landing_url": null,
                    "prospect": false,
                    "base_lead_score": null,
                    "eu_consent": "unknown",
                    "sms_number": "079123123123",
                    "sms_consent": false,
                    "lead_score": null,
                    "user_id": null,
                    "links": {
                        "account": "00000000"
                    }
                }
            ]
        },
        async run({ auth, propsValue }) {
            const request: HttpRequest = {
                method: HttpMethod.POST,
                url: `${dripCommon.baseUrl(propsValue.account_id)}/subscribers`,
                body: {
                    subscribers: [{
                        email: propsValue.subscriber,
                        tags: propsValue.tags,
                        custom_fields: propsValue.custom_fields,
                        country: propsValue.country,
                        address1: propsValue.address,
                        city: propsValue.city,
                        state: propsValue.state,
                        zip: propsValue.zip,
                        phone: propsValue.phone,
                        first_name: propsValue.first_name,
                        last_name: propsValue.last_name
                    }]

                },
                headers: {
                    'Authorization': dripCommon.authorizationHeader(auth)
                },
                queryParams: {},
            };
            return await httpClient.sendRequest<Record<string, never>>(request);
        }
    }
});
