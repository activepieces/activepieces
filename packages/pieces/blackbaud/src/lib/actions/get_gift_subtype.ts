import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';


export const blackbaudGetGiftSubtypes = createAction({
    name: 'get_gift_subtypes',
    description: 'Returns a list of gift subtypes.',
    displayName: 'Get Gift subtypes ',
    props: {
        ...blackbaudCommon.auth_props,
    },
    sampleData: [
        {
            "count": 12,
            "value": [
                "NotInFund",
                "Acreage",
                "Annuity",
                "Auction",
                "Bequest",
                "Charitable Lead Trust",
                "Charitable Remainder Trust",
                "Computers",
                "Event",
                "Life Insurance Policy",
                "Membership",
                "United Way"
            ]
        }
    ],
    async run(configValue) {
        const { authentication, subscription_key} = configValue.propsValue;
        const accessToken = authentication?.access_token;
        return (await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>({
            method: HttpMethod.GET,
            url: `https://api.sky.blackbaud.com/gift/v1/giftsubtypes`,
            headers: {
                "Bb-Api-Subscription-Key": subscription_key,
                Authorization: `Bearer ${accessToken}`,
            },
        })).body.value;
    },
});
