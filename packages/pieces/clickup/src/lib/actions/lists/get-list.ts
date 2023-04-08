import { createAction, Property} from "@activepieces/framework";
import { HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, callClickUpApi } from "../../common";


export const getClickupList = createAction({
	name: 'get_list',
	description: 'Gets a list in a ClickUp',
	displayName: 'Get List',
	props: {
		authentication: clickupCommon.authentication,
		list_id: Property.ShortText({
			description: 'The id of the list to get',
			displayName: 'List ID',
			required: true,
		}),
	},
	async run(configValue) {
		const { list_id, authentication } = configValue.propsValue;
		const response = await callClickUpApi(HttpMethod.GET,
			`list/${list_id}`, getAccessTokenOrThrow(authentication), {
		});

		return response.body;
	},
});
