import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { slidespeakAuth } from "../common/auth";

export const getTaskStatus = createAction({
    auth: slidespeakAuth,
    name: 'get_task_status',
    displayName: 'Get Task Status',
    description: 'Get status of a task by its ID.',
    props: {
        task_id: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task you want to check.',
            required: true,
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;
        const taskId = propsValue.task_id;

        const response = await makeRequest(
            auth,
            HttpMethod.GET,
            `/task_status/${taskId}`,
        );

        return response;
    },
});