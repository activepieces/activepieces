import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListStatusesOutputSchema } from '../../output-schemas';

export const attioListStatusesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_statuses',
	outputSchema: attioListStatusesOutputSchema,
	displayName: 'List Statuses',
	description: 'Lists the statuses of a status attribute.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the statuses of a status attribute, e.g. deal stages, with IDs and titles to use when writing values.',
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
			resourceUri: `/${target}/${identifier}/attributes/${attribute}/statuses`,
			query: { show_archived: show_archived ? 'true' : undefined },
		});
		return { statuses: response.data, count: response.data.length };
	},
});
