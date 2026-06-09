import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { beehiivApiCall } from '../common/client';
import { isNil } from '@activepieces/shared';

type SubscriptionListResponse = {
	data: Record<string, unknown>[];
	has_more: boolean;
	next_cursor: string | null;
};

export const listSubscriptionsAction = createAction({
	auth: beehiivAuth,
	name: 'list_subscriptions',
	displayName: 'List Subscriptions',
	description: 'Retrieves all subscriptions for a Beehiiv publication.',
	audience: 'both',
	aiMetadata: { description: 'Lists subscriptions for a beehiiv publication, optionally filtered by status (active, inactive, pending, etc.). Operates in two modes: when neither limit nor cursor is set it auto-paginates and returns every matching subscription; when a limit or cursor is provided it returns a single page with a next-cursor for manual pagination. Use to look up or enumerate subscribers. Read-only and idempotent.', idempotent: true },
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
			description:
				'Cursor token for fetching the next page of results. Leave empty to start from the beginning.',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, status, cursor, limit } = context.propsValue;

		const baseParams: Record<string, string | number | undefined> = {
			order_by: 'created',
			direction: 'desc',
		};

		if (status && status !== 'all') {
			baseParams['status'] = status;
		}

		if (!isNil(cursor) || !isNil(limit)) {
			return beehiivApiCall<SubscriptionListResponse>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/subscriptions`,
				query: {
					...baseParams,
					...(isNil(limit) ? {} : { limit }),
					...(isNil(cursor) || cursor === '' ? {} : { cursor }),
				},
			});
		}

		const allData: Record<string, unknown>[] = [];
		let nextCursor: string | undefined;

		do {
			const response = await beehiivApiCall<SubscriptionListResponse>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/subscriptions`,
				query: {
					...baseParams,
					limit: 100,
					...(nextCursor ? { cursor: nextCursor } : {}),
				},
			});

			if (!response.data || response.data.length === 0) break;
			allData.push(...response.data);
			nextCursor = response.next_cursor ?? undefined;
		} while (nextCursor);

		return allData;
	},
});
