import { createAction, Property, HttpMethod, getAccessTokenOrThrow } from "@activepieces/framework";
import { clickupCommon, callClickUpApi } from "../../common";


export const createClickupSubtask = createAction({
	name: 'create_subtask',
	description: 'Creates a subtask in ClickUp',
	displayName: 'Create Subtask',
	props: {
		authentication: clickupCommon.authentication,
		workspace_id: clickupCommon.workspace_id(),
		space_id: clickupCommon.space_id(),
		list_id: clickupCommon.list_id(),
		task_id: clickupCommon.task_id(),
		name: Property.ShortText({
			description: 'The name of the task to create',
			displayName: 'Task Name',
			required: true,
		}),
		description: Property.LongText({
			description: 'The description of the task to create',
			displayName: 'Task Description',
			required: true,
		}),
	},
	async run(configValue) {
		const { list_id, task_id, name, description, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.POST,
			`list/${list_id}/task`, getAccessTokenOrThrow(authentication), {
			name,
			description,
			"parent": task_id,
		});

		return response.body;
	},
});
