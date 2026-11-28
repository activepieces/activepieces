import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, isRecord, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const getPublicationEngagementsAiAction = createAction({
	auth: beehiivAuth,
	name: 'get_publication_engagements',
	classification: 'READ',
	displayName: 'Get Engagement Stats',
	description: 'Gets email opens and clicks per day, week or month for a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets email engagement (opens, unique opens, clicks, verified clicks) of a beehiiv publication per day, week or month for up to 31 days from a start date, for post emails, automated emails or both. Use it for trend reports. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.engagements,
	props: {
		publication_id: aiProps.publicationId(),
		start_date: Property.ShortText({ displayName: 'Start Date', description: 'First day as YYYY-MM-DD (default: yesterday).', required: false }),
		number_of_days: Property.Number({ displayName: 'Number Of Days', description: 'How many days from the start date (1-31, default 7).', required: false, defaultValue: 7 }),
		granularity: Property.StaticDropdown<string>({
			displayName: 'Granularity',
			description: 'day (default), week or month.',
			required: false,
			options: { options: ['day', 'week', 'month'].map((value) => ({ label: value, value })) },
		}),
		email_type: Property.StaticDropdown<string>({
			displayName: 'Email Type',
			description: 'post (newsletter posts), message (automated emails) or all (default).',
			required: false,
			options: { options: ['all', 'post', 'message'].map((value) => ({ label: value, value })) },
		}),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const startDate = aiInput.optionalText(propsValue.start_date);
		if (startDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
			throw new Error('Start Date must be a date as YYYY-MM-DD.');
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'GET',
			path: `${pathFor(['publications', publicationId])}/engagements`,
			operation: 'get publication engagements',
			query: {
				start_date: startDate,
				number_of_days: aiInput.integerInRange({ value: propsValue.number_of_days, label: 'Number Of Days', min: 1, max: 31, fallback: 7 }),
				granularity: aiInput.oneOf({ value: propsValue.granularity, label: 'Granularity', allowed: ['day', 'week', 'month'] }),
				email_type: aiInput.oneOf({ value: propsValue.email_type, label: 'Email Type', allowed: ['all', 'post', 'message'] }),
			},
		});
		const body = isRecord(response.body) ? response.body : {};
		const { data, ...meta } = body;
		return { ...meta, items: Array.isArray(data) ? data : [] };
	},
});
