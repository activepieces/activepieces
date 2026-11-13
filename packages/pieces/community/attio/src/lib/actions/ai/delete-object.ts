import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioDeleteObjectOutputSchema } from '../../output-schemas';

export const attioDeleteObjectAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_object',
	outputSchema: attioDeleteObjectOutputSchema,
	displayName: 'Delete Object',
	description: 'Permanently deletes a custom object and all of its records.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a custom object together with every record, attribute and list that depends on it. Only custom objects can be deleted; system objects such as people and companies are refused. Cannot be undone.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
	},
	async run(context) {
		const { object } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/objects/${object}`,
		});
		return { success: true, object };
	},
});
