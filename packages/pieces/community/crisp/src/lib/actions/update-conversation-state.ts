import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { crispAuth } from '../common/auth'
import { crispApiCall } from '../common/client'
import { sessionIdProp, websiteIdProp } from '../common/props'

export const updateConversationStateAction = createAction({
    auth: crispAuth,
    name: 'change_state',
    displayName: 'Change Conversation State',
    description: 'Updates the state of a conversation.',
    props: {
        websiteId: websiteIdProp,
        sessionId: sessionIdProp,
        state: Property.StaticDropdown({
            displayName: 'State',
            required: true,
            options: {
                options: [
                    { label: 'Unresolved', value: 'unresolved' },
                    { label: 'Resolved', value: 'resolved' },
                    { label: 'Pending', value: 'pending' },
                ],
            },
        }),
    },
    async run(context) {
        const { websiteId, sessionId, state } = context.propsValue

        const response = await crispApiCall({
            auth: context.auth,
            method: HttpMethod.PATCH,
            resourceUri: `/website/${websiteId}/conversation/${sessionId}/state`,
            body: {
                state,
            },
        })

        return response
    },
})
