import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { nitfyAuth } from "../../index";
import { nitfyCommon , callNitfyApi } from "../common";

const mddescription = `
# How to add a new connection
1. Login to your nifty account at https://niftypm.com/
2. From your account settings, click on App Center
3. After that click on Integrate with API
4. Then Create a new app
5. Select the Name and Description you want
6. copy the redirect url from the piece and fill the url field ( without https:// )
7. check out Milestones , Subtasks , Projects , Statuses , Tasks and Portfolios
8. copy the client id and client secret and paste them in the piece
`;

export const createTask = createAction({
    name: 'create_task',
    auth: nitfyAuth,
    displayName: 'Create Task',
    description: 'Create a task in nitfy',
    props: {
        description: Property.MarkDown({
            value: mddescription,
        }),
        portfolio: nitfyCommon.portfolio,
        project: nitfyCommon.project,
        status: nitfyCommon.status,
        milestone: nitfyCommon.milestone,
        task_name: Property.ShortText({
            displayName: 'Task Name',
            description: 'Enter the task name',
            required: true,
            defaultValue: 'Task created from ActivePieces',
        }),
    },
    async run(context) {
        const authentication = context.auth;
        const accessToken = authentication.access_token;
        const status = context.propsValue.status;
        const task_name = context.propsValue.task_name;
        const milestone = context.propsValue.milestone;

        const response = (await callNitfyApi(HttpMethod.POST, "tasks", accessToken, {
            name: task_name,
            task_group_id: status,
            milestone_id: milestone,
        })).body;
        
        return [ response ];
    }
})