import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listSegmentsAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_segments',
	classification: 'SEARCH',
	displayName: 'List Segments',
	description: 'Lists the subscriber segments of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the subscriber segments of a beehiiv publication with type, status and member count. Use a segment ID with "List Segment Members". Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listSegments,
	props: {
		publication_id: aiProps.publicationId(),
		type: Property.StaticDropdown<string>({
			displayName: 'Type',
			description: 'Only segments of this type. Leave empty for all.',
			required: false,
			options: { options: ['dynamic', 'static', 'manual'].map((value) => ({ label: value, value })) },
		}),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'segments']),
			operation: 'list segments',
			query: { type: aiInput.oneOf({ value: propsValue.type, label: 'Type', allowed: ['dynamic', 'static', 'manual'] }) },
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
