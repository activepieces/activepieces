import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';

export const getProjectAction = createAction({
	auth: ticktickAuth,
	name: 'get_project',
	displayName: 'Get Task List',
	description: 'Retrieves the details of a specific task list by ID.',
	props: {
		projectId: Property.ShortText({
			displayName: 'List ID',
			description: 'Select the list to retrieve details for.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId } = context.propsValue;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${projectId}`,
		});

		return response;
	},
});
