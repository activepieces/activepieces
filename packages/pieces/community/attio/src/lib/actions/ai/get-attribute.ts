import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioGetAttributeOutputSchema } from '../../output-schemas';

export const attioGetAttributeAction = createAction({
	auth: attioAuth,
	name: 'attio_get_attribute',
	outputSchema: attioGetAttributeOutputSchema,
	displayName: 'Get Attribute',
	description: 'Gets an attribute of an object or list.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one attribute by slug or ID, including its type and configuration.',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
	},
	async run(context) {
		const { target, identifier, attribute } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}`,
		});
		return response.data;
	},
});
