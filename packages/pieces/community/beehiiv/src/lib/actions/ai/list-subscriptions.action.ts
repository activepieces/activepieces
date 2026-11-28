import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { SUBSCRIPTION_EXPAND_VALUES, aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listSubscriptionsAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_subscriptions_ai',
	classification: 'SEARCH',
	displayName: 'List Subscriptions (AI)',
	description: 'Lists one page of subscribers of a publication, with filters and a cursor.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists one page of subscribers of a beehiiv publication, filtered by status, tier, exact email or signup date, newest first by default. Use Cursor from the previous result to get the next page. To fetch one known subscriber use "Get Subscription" instead. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listSubscriptions,
	props: {
		publication_id: aiProps.publicationId(),
		status: Property.StaticDropdown<string>({
			displayName: 'Status',
			description: 'Only subscribers with this status. Leave empty for all.',
			required: false,
			options: {
				options: ['active', 'inactive', 'pending', 'validating', 'invalid', 'needs_attention', 'paused'].map((value) => ({ label: value, value })),
			},
		}),
		tier: Property.StaticDropdown<string>({
			displayName: 'Tier',
			description: 'Only free or only premium subscribers. Leave empty for all.',
			required: false,
			options: {
				options: [
					{ label: 'Free', value: 'free' },
					{ label: 'Premium', value: 'premium' },
				],
			},
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Exact email address to match (case-insensitive). Partial emails match nothing.',
			required: false,
		}),
		created_on: Property.ShortText({
			displayName: 'Created On',
			description: 'Only subscribers created on this day, as YYYY-MM-DD (UTC).',
			required: false,
		}),
		include: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Include',
			description: 'Extra data to add to each subscriber.',
			required: false,
			options: {
				options: SUBSCRIPTION_EXPAND_VALUES.map((value) => ({ label: value, value })),
			},
		}),
		order: Property.StaticDropdown<string>({
			displayName: 'Order',
			description: 'Newest first (default) or oldest first.',
			required: false,
			options: {
				options: [
					{ label: 'Newest first', value: 'newest_first' },
					{ label: 'Oldest first', value: 'oldest_first' },
				],
			},
		}),
		limit: aiProps.limit(),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'The next_cursor value from a previous call. Leave empty for the first page.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const createdOn = aiInput.optionalText(propsValue.created_on);
		if (createdOn !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(createdOn)) {
			throw new Error('Created On must be a date as YYYY-MM-DD.');
		}
		const order = aiInput.oneOf({ value: propsValue.order, label: 'Order', allowed: ['newest_first', 'oldest_first'] });
		return beehiivClient.listCursorPage({
			apiKey: apiKeyOf(auth),
			path: `${pathFor(['publications', publicationId])}/subscriptions`,
			operation: 'list subscriptions',
			query: {
				status: aiInput.oneOf({ value: propsValue.status, label: 'Status', allowed: ['active', 'inactive', 'pending', 'validating', 'invalid', 'needs_attention', 'paused'] }),
				tier: aiInput.oneOf({ value: propsValue.tier, label: 'Tier', allowed: ['free', 'premium'] }),
				email: aiInput.optionalText(propsValue.email),
				creation_date: createdOn?.replace(/-/g, '/'),
				'expand[]': aiInput.textList({ value: propsValue.include, label: 'Include' }),
				order_by: 'created',
				direction: order === 'oldest_first' ? 'asc' : 'desc',
			},
			cursor: aiInput.optionalText(propsValue.cursor),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
