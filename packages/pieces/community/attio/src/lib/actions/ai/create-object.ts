import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateObjectOutputSchema } from '../../output-schemas';

export const attioCreateObjectAction = createAction({
	auth: attioAuth,
	name: 'attio_create_object',
	outputSchema: attioCreateObjectOutputSchema,
	displayName: 'Create Object',
	description: 'Creates a custom object.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a new custom object type in the workspace. Add attributes to it with Create Attribute. Not idempotent; slugs must be unique.',
		idempotent: false,
	},
	props: {
		api_slug: Property.ShortText({ displayName: 'API Slug', description: 'Unique snake_case slug, e.g. `projects`.', required: true }),
		singular_noun: Property.ShortText({ displayName: 'Singular Noun', description: 'e.g. `Project`.', required: true }),
		plural_noun: Property.ShortText({ displayName: 'Plural Noun', description: 'e.g. `Projects`.', required: true }),
	},
	async run(context) {
		const { api_slug, singular_noun, plural_noun } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/objects`,
			body: { data: { api_slug, singular_noun, plural_noun } },
		});
		return response.data;
	},
});
