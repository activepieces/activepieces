import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { trelloAuth } from '../../..'
import { trelloCommon } from '../../common'

export const getCardAttachments = createAction({
    auth: trelloAuth,
    name: 'get_card_attachments',
    displayName: 'Get All Card Attachments',
    description: 'Gets all attachments on a card.',
    props: {
        card_id: Property.ShortText({
            description: 'The ID of the card to get attachments from',
            displayName: 'Card ID',
            required: true,
        }),
    },

    async run(context) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url:
                `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/attachments` +
                `?key=` +
                context.auth.username +
                `&token=` +
                context.auth.password,
            headers: {
                Accept: 'application/json',
            },
        }

        const response = await httpClient.sendRequest(request)

        return response.body
    },
})
