import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { pipedriveAuth } from '../auth';

export const findLeadAction = createAction({
	auth: pipedriveAuth,
	name: 'find-lead',
	displayName: 'Find Lead',
	description: 'Finds leads by title.',
	props: {
		term: Property.ShortText({
			displayName: 'Title',
			description: 'The title to search for.',
			required: true,
		}),
		exact_match: Property.Checkbox({
			displayName: 'Exact Match',
			description: 'When enabled, only full exact matches against the given title are returned. It is not case sensitive.',
			required: false,
		}),
	},
	async run(context) {
		const { term, exact_match } = context.propsValue;

		let cursor: string | undefined = undefined;
		let hasMoreItems = true;
		const leads = [];

		do {
			const query: Record<string, string | boolean> = {
				term,
				fields: 'title',
				limit: '100',
			};

			if (exact_match) {
				query['exact_match'] = true;
			}

			if (cursor) {
				query['cursor'] = cursor;
			}

			const response = await pipedriveApiCall<{
				success: boolean;
				data: { items: Array<{ result_score: number; item: Record<string, unknown> }> };
				additional_data: { next_cursor?: string };
			}>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/v2/leads/search',
				query,
			});

			if (isNil(response.data?.items)) break;

			for (const lead of response.data.items) {
				leads.push(lead.item);
			}

			hasMoreItems = response.additional_data?.next_cursor != null;
			cursor = response.additional_data?.next_cursor;
		} while (hasMoreItems);

		return {
			found: leads.length > 0,
			data: leads,
		};
	},
});
