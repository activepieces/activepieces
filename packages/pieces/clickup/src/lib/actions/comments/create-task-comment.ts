import { createAction, Property } from "@activepieces/framework";
import {HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, callClickUpApi } from "../../common";


export const createClickupTaskComment = createAction({
	name: 'create_task_comments',
	description: 'Creates a comment on a task in ClickUp',
	displayName: 'Create Task Comment',
	props: {
		authentication: clickupCommon.authentication,
		workspace_id: clickupCommon.workspace_id(),
		space_id: clickupCommon.space_id(),
		list_id: clickupCommon.list_id(),
		task_id: clickupCommon.task_id(),
		comment: Property.LongText({
			description: 'Comment to make on the task',
			displayName: 'Comment',
			required: true,
		})
	},
	async run(configValue) {
		const { task_id, authentication, comment } = configValue.propsValue;

		const user_request = await callClickUpApi(HttpMethod.GET, `/user`, getAccessTokenOrThrow(authentication), {});

		if (user_request.body['user'] === undefined) {
			throw ('Please connect to your ClickUp account')
		}

		const response = await callClickUpApi(HttpMethod.POST,
			`/task/${task_id}/comment`, getAccessTokenOrThrow(authentication), {
			"comment_text": comment,
			"assignee": user_request.body['user']['id'],
			"notify_all": true
		});

		return response.body;
	},
})
