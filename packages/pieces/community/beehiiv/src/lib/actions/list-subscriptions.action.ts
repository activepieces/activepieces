import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { isNil } from '@activepieces/pieces-framework';
import { beehiivOutputSchemas } from '../common/output-schemas';

export const listSubscriptionsAction = createAction({
	auth: beehiivAuth,
	name: 'list_subscriptions',
	classification: 'SEARCH',
	displayName: 'List Subscriptions',
	description:
		'Retrieves subscriptions for a Beehiiv publication. With Limit and Cursor empty it returns every match (up to 5,000); set Limit or Cursor to get one page with a next cursor.',
	audience: 'human',
	aiMetadata: {
		description:
			'Lists subscriptions for a beehiiv publication, optionally filtered by status. With no limit or cursor it returns every match up to 5,000 and fails if more remain; with a limit or cursor it returns one page plus next_cursor. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.humanListSubscriptions,
	props: {
		publicationId: publicationId,
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Filter subscriptions by status.',
			required: false,
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'inactive' },
					{ label: 'Pending', value: 'pending' },
					{ label: 'Validating', value: 'validating' },
					{ label: 'Invalid', value: 'invalid' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of subscriptions to return per page (1-100).',
			required: false,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description: 'Cursor token for fetching the next page of results. Leave empty to start from the beginning.',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, status, cursor, limit } = context.propsValue;
		const apiKey = apiKeyOf(context.auth);
		const path = `${pathFor(['publications', publicationId])}/subscriptions`;
		const query = {
			order_by: 'created',
			direction: 'desc',
			status: status && status !== 'all' ? status : undefined,
		};

		if (!isNil(cursor) || !isNil(limit)) {
			const response = await beehiivClient.request({
				apiKey,
				method: 'GET',
				path,
				operation: 'list subscriptions',
				query: { ...query, limit: isNil(limit) ? undefined : limit, cursor: isNil(cursor) || cursor === '' ? undefined : cursor },
			});
			return response.body;
		}

		return beehiivClient.listAllCursor<Record<string, unknown>>({
			apiKey,
			path,
			operation: 'list subscriptions',
			query,
			maxItems: MAX_SUBSCRIPTIONS,
		});
	},
});

const MAX_SUBSCRIPTIONS = 5_000;
