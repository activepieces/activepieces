import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { FieldResponse, ListAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const listProjectFieldsAction = createAction({
	auth: taskadeAuth,
	name: 'list_project_fields',
	displayName: 'List Custom Fields',
	description: 'Lists the custom fields of a project, with select options.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Lists the custom fields defined on one Taskade project: field ID, type (for example number, string, Select), name and, for Select fields, the option IDs and names. Use before Set Custom Field Value to get the field ID and a valid option ID. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['listProjectFields'],
	async run(context) {
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const response = await taskadeApi.request<ListAPIResponse<FieldResponse>>({
			token: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/projects/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}/fields`,
			operation: 'list custom fields',
		});
		return { items: (response.items ?? []).map((field) => taskadeNormalize.field(field)) };
	},
});
