import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { intercomRequest } from '../../common';
import { listSegmentsOutputSchema } from '../../output-schemas';

export const listSegmentsAction = createAction({
	auth: intercomAuth,
	name: 'list_segments',
	classification: 'SEARCH',
	displayName: 'List Segments',
	description: 'Lists the contact segments in the workspace.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every contact segment with ID, name and person type, optionally with the number of contacts in each. Use to find a segment ID before Search Contacts or List Companies. Read-only.',
		idempotent: true,
	},
	props: {
		includeCount: Property.Checkbox({
			displayName: 'Include Counts',
			description: 'Also return how many contacts are in each segment.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: listSegmentsOutputSchema,
	async run(context) {
		const body = await intercomRequest<{ segments?: Array<Record<string, unknown>> }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['segments'],
			query: { include_count: context.propsValue.includeCount === true ? true : undefined },
			operation: 'list segments',
		});
		return {
			items: (body.segments ?? []).map((segment) => ({
				id: segment['id'],
				name: segment['name'] ?? null,
				person_type: segment['person_type'] ?? null,
				count: segment['count'] ?? null,
				created_at: segment['created_at'] ?? null,
				updated_at: segment['updated_at'] ?? null,
			})),
		};
	},
});
