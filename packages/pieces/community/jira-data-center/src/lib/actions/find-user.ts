import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'find-user',
	displayName: 'Find User',
	description: 'Finds an existing user.',
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword',
			required: true,
		}),
	},
	async run(context) {
		const response = await jiraApiCall<Array<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/user/search',
			query: {
				username: context.propsValue.keyword,
			},
		});

		return {
			found: response.length > 0,
			data: response,
		};
	},
});
