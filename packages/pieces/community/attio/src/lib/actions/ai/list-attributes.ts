import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListAttributesOutputSchema } from '../../output-schemas';

export const attioListAttributesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_attributes',
	outputSchema: attioListAttributesOutputSchema,
	displayName: 'List Attributes',
	description: 'Lists the attributes of an object or list.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists attributes (fields) of an object or list with their slug, type and settings. Use it before writing values to learn slugs and types.',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		limit: attioAi.limitProp({ max: 1000 }),
		offset: attioAi.offsetProp(),
		show_archived: Property.Checkbox({ displayName: 'Show Archived', description: 'Include archived items.', required: false }),
	},
	async run(context) {
		const { target, identifier, limit, offset, show_archived } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/${target}/${identifier}/attributes`,
			query: { limit, offset, show_archived: show_archived ? 'true' : undefined },
		});
		return { attributes: response.data, count: response.data.length };
	},
});
