import { createAction, Property, HttpMethod, getAccessTokenOrThrow } from "@activepieces/framework";
import { clickupCommon, callClickUpApi } from "../../common";


export const getClickupSpaces = createAction({
	name: 'get_spaces',
	description: 'Gets spaces in a ClickUp workspace',
	displayName: 'Get Spaces',
	props: {
		authentication: clickupCommon.authentication,
		team_id: Property.ShortText({
			description: 'The id of the space to get',
			displayName: 'Team ID',
			required: true,
		}),
	},
	async run(configValue) {
		const { team_id, authentication } = configValue.propsValue;
		return await callClickUpApi(HttpMethod.GET,
			`team/${team_id}/space`, getAccessTokenOrThrow(authentication), {
		});
	},
});
