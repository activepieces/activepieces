import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { tagsOutputSchema } from '../../output-schemas';

export const listTagsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_tags',
	outputSchema: tagsOutputSchema,
	displayName: 'List Tags',
	description: 'Lists or searches the tags of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the tags of a Clockify workspace, optionally filtered by name (exact or contains) or archived state. Use it to find tag IDs for time entries. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only tags whose name contains this text.',
			required: false,
		}),
		exactMatch: Property.Checkbox({
			displayName: 'Exact Name Match',
			description: 'Match Name exactly instead of contains. Default false.',
			required: false,
		}),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Optional: only archived (Yes) or only active (No) tags. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const tags = await clockifyApi.listTags({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					'strict-name-search': propsValue.exactMatch,
					archived: propsValue.archived,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { tags, count: tags.length };
	},
});
