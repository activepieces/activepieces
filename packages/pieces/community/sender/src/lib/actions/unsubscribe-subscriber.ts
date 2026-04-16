import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { subscribe } from 'diagnostics_channel'
import { makeSenderRequest, senderAuth, subscriberDropdownSingle } from '../common/common'

export const unsubscribeSubscriberAction = createAction({
    auth: senderAuth,
    name: 'unsubscribe_subscriber',
    displayName: 'Unsubscribe Subscriber',
    description: 'Mark an email address as unsubscribed globally or from a group',
    props: {
        subscriber: subscriberDropdownSingle,
    },
    async run(context) {
        const subscriber = context.propsValue.subscriber
        const subscriberId = subscriber

        const requestBody = {
            subscribers: [subscriberId],
        }

        const response = await makeSenderRequest(
            context.auth.secret_text,
            `/subscribers`,
            HttpMethod.DELETE,
            requestBody,
        )
        return response.body
    },
})
