import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';
import { blackbaudAuth } from '../..';

export const blackbaudCreateGift = createAction({
    auth: blackbaudAuth,
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
    async run(configValue) {
        const { subscription_key, gift_json } = configValue.propsValue;
        const accessToken = configValue.auth.access_token;
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
