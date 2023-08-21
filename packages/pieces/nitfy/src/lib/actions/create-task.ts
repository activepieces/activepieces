import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { nitfyAuth } from "../../index";
import { nitfyCommon , callNitfyApi } from "../common";

export const createTask = createAction({
    name: 'create_task',
    auth: nitfyAuth,
    displayName: 'Create Task',
    description: 'Create a task in nitfy',
    props: {
        // portfolio: nitfyCommon.Portfolios,
        task_name: Property.ShortText({
            displayName: 'Task Name',
            description: 'Enter the task name',
            required: true,
        }),
    },
    async run(context) {
        
        return [ context.auth.access_token, context.propsValue.task_name];
    }
})