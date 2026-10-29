import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateSelectOptionOutputSchema } from '../../output-schemas';

export const attioCreateSelectOptionAction = createAction({
	auth: attioAuth,
	name: 'attio_create_select_option',
	outputSchema: attioCreateSelectOptionOutputSchema,
	displayName: 'Create Select Option',
	description: 'Adds an option to a select attribute.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Adds a new option to a select or multiselect attribute. Options cannot be deleted, only archived with Update Select Option. Not idempotent.',
		idempotent: false,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		title: Property.ShortText({ displayName: 'Title', required: true }),
	},
	async run(context) {
		const { target, identifier, attribute, title } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/options`,
			body: { data: { title } },
		});
		return response.data;
	},
});
