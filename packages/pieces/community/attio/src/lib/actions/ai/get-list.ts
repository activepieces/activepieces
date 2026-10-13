import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateListOutputSchema } from '../../output-schemas';

export const attioGetListAction = createAction({
	auth: attioAuth,
	name: 'attio_get_list',
	outputSchema: attioCreateListOutputSchema,
	displayName: 'Get List',
	description: 'Gets a list by its slug or ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one list by slug or ID, including its parent object and access settings.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
	},
	async run(context) {
		const { list } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/lists/${list}`,
		});
		return response.data;
	},
});
