import {
    createAction,
    Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { bitlyAuth } from '../../index';

export const deleteBitlink = createAction({
    auth: bitlyAuth,
    name: 'delete_bitlink',
    displayName: 'Delete Bitlink',
    description: 'Delete a Bitlink.',
    props: {
        bitlink: Property.ShortText({
            description: 'The ID of Bitlink to delete.',
            displayName: 'Bitlink',
            required: true
        })
    },
    async run(context) {
        return await httpClient.sendRequest<{ link: string }>({
            method: HttpMethod.DELETE,
            url: `https://api-ssl.bitly.com/v4/bitlinks/${context.propsValue.bitlink}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string
            }
        })
    }
})