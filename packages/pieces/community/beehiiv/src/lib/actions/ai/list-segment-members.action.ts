import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listSegmentMembersAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_segment_members',
	classification: 'SEARCH',
	displayName: 'List Segment Members',
	description: 'Lists the subscribers in a segment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the subscribers in one beehiiv segment (get the Segment ID from "List Segments"), optionally with custom fields, tags and stats. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listSegmentMembers,
	props: {
		publication_id: aiProps.publicationId(),
		segment_id: Property.ShortText({ displayName: 'Segment ID', description: 'The segment ID from "List Segments".', required: true }),
		include: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Include',
			description: 'Extra data to add to each member.',
			required: false,
			options: { options: ['custom_fields', 'tags', 'stats', 'referrals', 'subscription_premium_tiers'].map((value) => ({ label: value, value })) },
		}),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'segments', aiInput.requireText({ value: propsValue.segment_id, label: 'Segment ID' }), 'members']),
			operation: 'list segment members',
			query: { 'expand[]': aiInput.textList({ value: propsValue.include, label: 'Include' }) },
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
