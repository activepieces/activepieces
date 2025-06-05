import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall, BeehiivPaginatedApiCall } from '../common/client';
import { isNil } from '@activepieces/shared';

export const listAutomationsAction = createAction({
	auth: beehiivAuth,
	name: 'list_automations',
	displayName: 'List Automations',
	description: 'Retrieves a list of automations for a publication.',
	props: {
		publicationId: publicationId,
		limit: Property.Number({
			displayName: 'Limit',
			description: 'A limit on the number of automations to be returned (1-100, default 10).',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'The page number for pagination (default 1).',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, page, limit } = context.propsValue;

		if (isNil(page) && isNil(limit)) {
			const response = await BeehiivPaginatedApiCall({
				apiKey: context.auth,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/automations`,
			});

			return response;
		}

		const response = await beehiivApiCall<{ data: Record<string, any>[] }>({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/publications/${publicationId}/automations`,
			query: {
				page,
				limit,
			},
		});

		return response.data;
	},
});
