import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { socialSetDropdown } from '../common/props';
import { TypefullyDraft, TypefullyPaginatedResponse } from '../common/types';

export const listDraftsAction = createAction({
	auth: typefullyAuth,
	name: 'typefully_list_drafts',
	displayName: 'List Drafts',
	description: 'List drafts with optional filters.',
	props: {
		social_set_id: socialSetDropdown,
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Filter by draft status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Draft', value: 'draft' },
					{ label: 'Scheduled', value: 'scheduled' },
					{ label: 'Published', value: 'published' },
					{ label: 'Publishing', value: 'publishing' },
					{ label: 'Error', value: 'error' },
				],
			},
		}),
		order_by: Property.StaticDropdown({
			displayName: 'Order By',
			description: 'Sort order for the results.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Created At (newest first)', value: '-created_at' },
					{ label: 'Created At (oldest first)', value: 'created_at' },
					{ label: 'Updated At (newest first)', value: '-updated_at' },
					{ label: 'Updated At (oldest first)', value: 'updated_at' },
					{ label: 'Scheduled Date (newest first)', value: '-scheduled_date' },
					{ label: 'Scheduled Date (oldest first)', value: 'scheduled_date' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of drafts to return (1-50).',
			required: false,
			defaultValue: 10,
		}),
	},
	async run(context) {
		const { social_set_id, status, order_by, limit } = context.propsValue;

		return await typefullyApiCall<TypefullyPaginatedResponse<TypefullyDraft>>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/social-sets/${social_set_id}/drafts`,
			query: {
				status,
				order_by,
				limit: limit ?? 10,
			},
		});
	},
});
