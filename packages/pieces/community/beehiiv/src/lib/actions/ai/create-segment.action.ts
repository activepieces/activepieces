import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const createSegmentAiAction = createAction({
	auth: beehiivAuth,
	name: 'create_segment',
	classification: 'WRITE',
	displayName: 'Create Segment',
	description: 'Creates a manual segment from a list of emails or subscription IDs.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a manual (fixed-membership) segment in a beehiiv publication from up to 1,000 existing subscriber emails or subscription IDs (give one list, not both). Emails that are not subscribers are ignored. Each call creates a new segment.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.createSegment,
	props: {
		publication_id: aiProps.publicationId(),
		name: Property.ShortText({ displayName: 'Name', description: 'The segment name.', required: true }),
		emails: Property.Array({ displayName: 'Emails', description: 'Subscriber email addresses. Provide this OR Subscription IDs.', required: false }),
		subscription_ids: Property.Array({ displayName: 'Subscription IDs', description: 'Subscription IDs (sub_...). Provide this OR Emails.', required: false }),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const emails = aiInput.textList({ value: propsValue.emails, label: 'Emails' });
		const subscriptionIds = aiInput.textList({ value: propsValue.subscription_ids, label: 'Subscription IDs' });
		if (emails === undefined && subscriptionIds === undefined) {
			throw new Error('Provide Emails or Subscription IDs.');
		}
		if (emails !== undefined && subscriptionIds !== undefined) {
			throw new Error('Provide either Emails or Subscription IDs, not both.');
		}
		const members = emails ?? subscriptionIds ?? [];
		if (members.length > MAX_MEMBERS) {
			throw new Error(`A segment can be created from at most ${MAX_MEMBERS} entries per call.`);
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'POST',
			path: pathFor(['publications', publicationId, 'segments']),
			operation: 'create segment',
			body: {
				name: aiInput.requireText({ value: propsValue.name, label: 'Name' }),
				input: emails !== undefined ? { type: 'emails', emails } : { type: 'subscriptions', subscriptions: subscriptionIds },
			},
		});
		return aiInput.dataOf(response.body);
	},
});

const MAX_MEMBERS = 1_000;
