import { createAction, Property, HttpMethod, getAccessTokenOrThrow } from "@activepieces/framework";
import { clickupCommon, callClickUpApi } from "../../common";


export const createClickupTaskComment = createAction({
	name: 'create_task_comments',
	description: 'Creates a comment on a task in ClickUp',
	displayName: 'Create Task Comment',
	props: {
		authentication: clickupCommon.authentication,
		task_id: Property.ShortText({
			description: 'The ID of the task to comment on',
			displayName: 'Task ID',
			required: true,
		}),
        comment: Property.LongText({
            description: 'Comment to make on the task',
            displayName: 'Comment',
            required: true,
        })
	},
	async run(configValue) {
		const { task_id, authentication, comment } = configValue.propsValue;

		const user_request = await callClickUpApi(HttpMethod.GET, `/user`, getAccessTokenOrThrow(authentication), {});

		if (user_request.body.user === undefined) {
			throw('Please connect to your ClickUp account')
		}

		const response = await callClickUpApi(HttpMethod.POST,
			`/task/${task_id}/comment`, getAccessTokenOrThrow(authentication), {
				"comment_text": comment,
				"assignee": user_request.body.user.id,
				"notify_all": true
		});

		return response.body;
	},
});
