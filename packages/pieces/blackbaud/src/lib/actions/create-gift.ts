import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';

export const blackbaudCreateGift = createAction({
    name: 'create_gift',
    description: 'Create gift',
    displayName: 'Create gift',
    props: {
        ...blackbaudCommon.auth_props,
        gift_json: Property.Json({
            displayName: "Gift (JSON)",
            description: "The Gift JSON",
            defaultValue: {
                "amount": {
                    "value": 100
                },
                "constituent_id": "280",
                "gift_splits": [
                    {
                        "amount": {
                            "value": 100
                        },
                        "fund_id": "41"
                    }
                ],
                "type": "Donation",
                "payments": [
                    {
                        "payment_method": "Cash"
                    }
                ]
            },
            required: true
        })
    },
    sampleData: [
        {
            "amount": {
                "value": 100
            },
            "constituent_id": "280",
            "date": "2017-10-03T00:00:00Z",
            "fundraisers": [
                {
                    "amount": {
                        "value": 100
                    },
                    "constituent_id": "252"
                }
            ],
            "gift_splits": [
                {
                    "amount": {
                        "value": 100
                    },
                    "appeal_id": "15",
                    "campaign_id": "1",
                    "fund_id": "41"
                }
            ],
            "gift_status": "Active",
            "is_anonymous": false,
            "lookup_id": "2225",
            "payments": [
                {
                    "payment_method": "Cash"
                }
            ],
            "post_date": "2017-10-03T00:00:00Z",
            "post_status": "NotPosted",
            "reference": "newly added gift",
            "soft_credits": [
                {
                    "amount": {
                        "value": 100
                    },
                    "constituent_id": "187"
                }
            ],
            "subtype": "Annuity",
            "type": "Donation"
        }
    ],
    async run(configValue) {
        const { authentication, subscription_key, gift_json } = configValue.propsValue;
        const accessToken = authentication?.access_token;
        return (await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `https://api.sky.blackbaud.com/gift/v1/gifts`,
            body: gift_json,
            headers: {
                "Bb-Api-Subscription-Key": subscription_key,
                Authorization: `Bearer ${accessToken}`,
            },
        }));
    },
});
