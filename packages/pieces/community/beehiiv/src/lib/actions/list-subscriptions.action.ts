import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { publicationId } from '../common/props';
import { beehiivApiCall, BeehiivPaginatedApiCall } from '../common/client';
import { isNil } from '@activepieces/shared';

export const listSubscriptionsAction = createAction({
	auth: beehiivAuth,
	name: 'list_subscriptions',
	displayName: 'List Subscriptions',
	description: 'Retrieves all subscriptions for a Beehiiv publication.',
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
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Number of subscriptions to return per page (1-100).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number for pagination (default 1).',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, status, page, limit } = context.propsValue;

		const queryParams: Record<string, string | undefined> = {
			order_by: 'created',
			direction: 'desc',
		};

		if (status && status !== 'all') {
			queryParams['status'] = status;
		}

		if (isNil(page) && isNil(limit)) {
			return BeehiivPaginatedApiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/subscriptions`,
				query: queryParams,
			});
		}

		const response = await beehiivApiCall<{ data: Record<string, unknown>[] }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/subscriptions`,
			query: {
				page,
				limit,
				...queryParams,
			},
		});

		return response.data;
	},
});
