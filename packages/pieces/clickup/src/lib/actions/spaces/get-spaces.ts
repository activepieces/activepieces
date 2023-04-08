import { createAction, Property} from "@activepieces/framework";
import {  HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";

import { clickupCommon, callClickUpApi } from "../../common";


export const getClickupSpaces = createAction({
	name: 'get_spaces',
	description: 'Gets spaces in a ClickUp workspace',
	displayName: 'Get Spaces',
	props: {
		authentication: clickupCommon.authentication,
		team_id: clickupCommon.workspace_id()
	},
	async run(configValue) {
		const { team_id, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.GET,
			`team/${team_id}/space`, getAccessTokenOrThrow(authentication), {
		});

		return response.body;
	},
});
