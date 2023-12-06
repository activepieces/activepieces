import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { bitlyAuth } from '../../index';

export const getBitlinkDetails = createAction({
    auth: bitlyAuth,
    name: 'get_bitlink_details',
    displayName: 'Get Bitlink Details',
    description: 'Get details about a Bitlink.',
    props: {
        bitlink: Property.ShortText({
            description: 'The ID of Bitlink to get details about.',
            displayName: 'Bitlink',
            required: true
        })
    },
    async run(context) {
        return await httpClient.sendRequest<{ link: string }>({
            method: HttpMethod.GET,
            url: `https://api-ssl.bitly.com/v4/bitlinks/${context.propsValue.bitlink}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string
            }
        })
    }
})

