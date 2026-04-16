import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { clickupAuth } from '../../auth'
import { callClickUpApi3, clickupCommon } from '../../common'

export const deleteClickupMessage = createAction({
    auth: clickupAuth,
    name: 'delete_message',
    description: 'Deletes a message in a ClickUp channel',
    displayName: 'Delete Message',
    props: {
        workspace_id: clickupCommon.workspace_id(),
        message_id: Property.ShortText({
            description: 'ID of the message to delete',
            displayName: 'Message ID',
            required: true,
        }),
    },

    async run(configValue) {
        const { workspace_id, message_id } = configValue.propsValue
        const response = await callClickUpApi3(
            HttpMethod.DELETE,
            `workspaces/${workspace_id}/chat/messages/${message_id}`,
            getAccessTokenOrThrow(configValue.auth),
            {},
            {},
        )
        return response.body
    },
})
