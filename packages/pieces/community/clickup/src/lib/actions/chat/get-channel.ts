import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { clickupAuth } from '../../auth'
import { callClickUpApi3, clickupCommon } from '../../common'

export const getClickupChannel = createAction({
    auth: clickupAuth,
    name: 'get_channel',
    description: 'Gets a channel in a ClickUp workspace',
    displayName: 'Get Channel',
    props: {
        workspace_id: clickupCommon.workspace_id(),
        channel_id: clickupCommon.channel_id(),
    },

    async run(configValue) {
        const { workspace_id, channel_id } = configValue.propsValue
        const response = await callClickUpApi3(
            HttpMethod.GET,
            `workspaces/${workspace_id}/chat/channels/${channel_id}`,
            getAccessTokenOrThrow(configValue.auth),
            undefined,
            {},
        )
        return response.body
    },
})
