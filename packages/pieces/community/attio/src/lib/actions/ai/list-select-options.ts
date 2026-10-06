import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListSelectOptionsOutputSchema } from '../../output-schemas';

export const attioListSelectOptionsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_select_options',
	outputSchema: attioListSelectOptionsOutputSchema,
	displayName: 'List Select Options',
	description: 'Lists the options of a select attribute.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the options of a select or multiselect attribute, with IDs and titles to use when writing values.',
		idempotent: true,
	},
	props: {
		target: attioAi.targetProp(),
		identifier: attioAi.identifierProp(),
		attribute: attioAi.attributeProp(),
		show_archived: Property.Checkbox({ displayName: 'Show Archived', description: 'Include archived items.', required: false }),
	},
	async run(context) {
		const { target, identifier, attribute, show_archived } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/options`,
			query: { show_archived: show_archived ? 'true' : undefined },
		});
		return { options: response.data, count: response.data.length };
	},
});
