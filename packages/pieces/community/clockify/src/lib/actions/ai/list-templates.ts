import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { templatesOutputSchema } from '../../output-schemas';

export const listTemplatesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_templates',
	outputSchema: templatesOutputSchema,
	displayName: 'List Templates',
	description: 'Lists the timesheet templates of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the timesheet templates (saved sets of project/task rows) in a workspace, optionally filtered by name. Use it to find a template ID. Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only templates whose name contains this text.',
			required: false,
		}),
		hydrated: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Return the template projects, tasks and entries. Default false.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const templates = await clockifyApi.listTemplates({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					hydrated: propsValue.hydrated,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { templates, count: templates.length };
	},
});
