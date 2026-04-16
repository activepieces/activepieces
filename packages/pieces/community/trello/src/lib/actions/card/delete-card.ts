import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { trelloAuth } from '../../..'
import { trelloCommon } from '../../common'

export const deleteCard = createAction({
    auth: trelloAuth,
    name: 'delete_card',
    displayName: 'Delete Card',
    description: 'Deletes an existing card.',
    props: {
        card_id: Property.ShortText({
            description: 'The ID of the card to delete.',
            displayName: 'Card ID',
            required: true,
        }),
    },

    async run(context) {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url:
                `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}` +
                `?key=` +
                context.auth.username +
                `&token=` +
                context.auth.password,
            headers: {
                Accept: 'application/json',
            },
            queryParams: {},
        }

        const response = await httpClient.sendRequest(request)

        return response.body
    },
})
