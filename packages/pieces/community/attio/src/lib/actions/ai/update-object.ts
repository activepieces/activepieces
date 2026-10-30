import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioCreateObjectOutputSchema } from '../../output-schemas';

export const attioUpdateObjectAction = createAction({
	auth: attioAuth,
	name: 'attio_update_object',
	outputSchema: attioCreateObjectOutputSchema,
	displayName: 'Update Object',
	description: 'Updates the slug or names of an object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates only the supplied fields of an object. Changing the slug breaks integrations that use the old one.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		api_slug: Property.ShortText({ displayName: 'API Slug', required: false }),
		singular_noun: Property.ShortText({ displayName: 'Singular Noun', required: false }),
		plural_noun: Property.ShortText({ displayName: 'Plural Noun', required: false }),
	},
	async run(context) {
		const { object, api_slug, singular_noun, plural_noun } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.PATCH,
			resourceUri: `/objects/${object}`,
			body: { data: attioAi.compact({ api_slug, singular_noun, plural_noun }) },
		});
		return response.data;
	},
});
