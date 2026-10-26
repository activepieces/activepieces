import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateObjectOutputSchema } from '../../output-schemas';

export const attioGetObjectAction = createAction({
	auth: attioAuth,
	name: 'attio_get_object',
	outputSchema: attioCreateObjectOutputSchema,
	displayName: 'Get Object',
	description: 'Gets an object by its slug or ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one object by slug or ID, with its singular and plural names.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
	},
	async run(context) {
		const { object } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${object}`,
		});
		return response.data;
	},
});
