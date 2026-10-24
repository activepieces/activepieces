import { createAction } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceListTasksOutputSchema } from '../../../output-schemas';

export const listTasksAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_list_tasks',
	outputSchema: zohoInvoiceListTasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists the tasks of a project.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the tasks of one project with task_id, name, rate and status, one page at a time. Use List Projects to find the project ID. Use it to find the task ID that time entries need.',
		idempotent: true,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		projectId: zohoInvoiceAiProps.projectId({ required: true }),
		page: zohoInvoiceAiProps.page({ required: false }),
		perPage: zohoInvoiceAiProps.perPage({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.listProjectTasks({
			auth,
			organizationId: propsValue.organizationId,
			projectId: propsValue.projectId,
			page: propsValue.page,
			perPage: propsValue.perPage,
		});
	},
});
