import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';
import { blackbaudAuth } from '../..';


export const blackbaudGetGiftSubtypes = createAction({
    auth: blackbaudAuth,
    name: 'get_gift_subtypes',
    description: 'Returns a list of gift subtypes.',
    displayName: 'Get Gift subtypes ',
    props: {
        ...blackbaudCommon.auth_props,
    },
    async run(configValue) {
        const { subscription_key } = configValue.propsValue;
        const accessToken = configValue.auth.access_token;
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
