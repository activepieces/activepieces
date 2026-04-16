import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { clickupAuth } from '../../auth'
import { callClickUpApi } from '../../common'

export const getClickupTask = createAction({
    auth: clickupAuth,
    name: 'get_list_task',
    description: 'Gets a task in a ClickUp list',
    displayName: 'Get Task',
    props: {
        task_id: Property.ShortText({
            description: 'The ID of the task to get',
            displayName: 'Task ID',
            required: true,
        }),
        include_subtasks: Property.Checkbox({
            description: 'Include subtasks in the response',
            displayName: 'Include Subtasks',
            required: false,
            defaultValue: false,
        }),
    },
    async run(configValue) {
        const { task_id } = configValue.propsValue

        const response = await callClickUpApi(
            HttpMethod.GET,
            `task/${task_id}`,
            getAccessTokenOrThrow(configValue.auth),
            undefined,
        )

        return response.body
    },
})
