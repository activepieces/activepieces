import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { clickupAuth } from '../../auth'
import { callClickUpApi3, clickupCommon } from '../../common'

export const getClickupMessageReplies = createAction({
    auth: clickupAuth,
    name: 'get_message_replies',
    description: 'Gets the replies of a message in a ClickUp channel',
    displayName: 'Get Message Replies',
    props: {
        workspace_id: clickupCommon.workspace_id(),
        message_id: Property.ShortText({
            description: 'ID of the message to get replies for',
            displayName: 'Message ID',
            required: true,
        }),
    },

    async run(configValue) {
        const { workspace_id, message_id } = configValue.propsValue
        const response = await callClickUpApi3(
            HttpMethod.GET,
            `workspaces/${workspace_id}/chat/messages/${message_id}/replies`,
            getAccessTokenOrThrow(configValue.auth),
            {},
            {},
        )
        return response.body
    },
})
