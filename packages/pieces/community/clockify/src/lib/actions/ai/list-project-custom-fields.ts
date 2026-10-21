import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { projectCustomFieldsOutputSchema } from '../../output-schemas';

export const listProjectCustomFieldsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_project_custom_fields',
	outputSchema: projectCustomFieldsOutputSchema,
	displayName: 'List Project Custom Fields',
	description: 'Lists the custom fields of a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the custom fields that apply to one project, with their IDs, types, allowed values and project default values. Needs a Clockify plan with custom fields (Pro or higher).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Optional: only fields with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Visible', value: 'VISIBLE' },
					{ label: 'Invisible', value: 'INVISIBLE' },
					{ label: 'Inactive', value: 'INACTIVE' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const customFields = await clockifyApi.listProjectCustomFields({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			query: clockifyUtils.toQuery({ params: { status: propsValue.status } }),
		});
		return { customFields, count: customFields.length };
	},
});
