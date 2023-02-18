import { createAction, Property, HttpMethod, getAccessTokenOrThrow } from "@activepieces/framework";
import { clickupCommon, callClickUpApi } from "../common";


export const createClickupList = createAction({
	name: 'create_list',
	description: 'Create a new list in a ClickUp workspace and space',
	displayName: 'Create List',
	props: {
		authentication: clickupCommon.authentication,
		workspace_id: clickupCommon.workspace_id,
		space_id: clickupCommon.space_id,
		name: Property.ShortText({
			description: 'The name of the list to create',
			displayName: 'List Name',
			required: true,
		}),
	},
	async run(configValue) {
		const { space_id, name, authentication } = configValue.propsValue;
		return await callClickUpApi(HttpMethod.POST,
			`space/${space_id}/list`, getAccessTokenOrThrow(authentication), {
			name,
		});
	},
});
