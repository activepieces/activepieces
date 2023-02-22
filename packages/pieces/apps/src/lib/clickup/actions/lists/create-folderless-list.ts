import { createAction, Property, HttpMethod, getAccessTokenOrThrow } from "@activepieces/framework";
import { clickupCommon, callClickUpApi } from "../../common";


export const createClickupFolderlessList = createAction({
	name: 'create_folderless_list',
	description: 'Create a new folderless list in a ClickUp workspace and space',
	displayName: 'Create Folderless List',
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
		const response = await callClickUpApi(HttpMethod.POST,
			`space/${space_id}/list`, getAccessTokenOrThrow(authentication), {
			name,
		});

		return response.body;
	},
});
