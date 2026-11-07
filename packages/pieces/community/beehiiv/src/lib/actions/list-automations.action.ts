import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall, BeehiivPaginatedApiCall } from '../common/client';
import { isNil } from '@activepieces/pieces-framework';

export const listAutomationsAction = createAction({
	auth: beehiivAuth,
	name: 'list_automations',
	classification: 'SEARCH',
	displayName: 'List Automations',
	description: 'Retrieves a list of automations for a publication.',
	audience: 'both',
	aiMetadata: { description: 'Lists the automations configured for a beehiiv publication. When neither page nor limit is set it auto-paginates and returns all automations; otherwise it returns the requested page. Use to discover automation IDs before enrolling subscribers. Read-only and idempotent.', idempotent: true },
	props: {
		publicationId: publicationId,
		paging_info: Property.MarkDown({
			value: 'Leave Limit and Page empty to get every automation.',
			variant: MarkdownVariant.INFO,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Automations per page, 1 to 100.',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1.',
			required: false,
		}),
	},
	async run(context) {
		const { publicationId, page, limit } = context.propsValue;

		if (isNil(page) && isNil(limit)) {
			const response = await BeehiivPaginatedApiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/publications/${publicationId}/automations`,
			});

			return response;
		}

		const response = await beehiivApiCall<{ data: Record<string, any>[] }>({
			apiKey: context.auth.secret_text,
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
