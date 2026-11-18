import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListWorkflowsOutputSchema } from '../../output-schemas';

export const senderListWorkflowsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_workflows',
	outputSchema: senderListWorkflowsOutputSchema,
	displayName: 'List Workflows',
	description: 'Lists one page of automation workflows.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of automation workflows with their ID, title, status and email stats, optionally filtered by status or an exact title (the title filter matches the full title only, not part of it). Use it to find a workflow ID. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({
			required: false,
			description: 'Workflows per page, 1 to 100. Defaults to 10.',
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only return workflows with this status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Draft', value: 'DRAFT' },
					{ label: 'Active', value: 'ACTIVE' },
					{ label: 'Paused', value: 'PAUSED' },
				],
			},
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Only return the workflow with exactly this title, e.g. "Welcome (Ecommerce)".',
			required: false,
		}),
	},
	async run(context) {
		return await senderApi.listWorkflows({ auth: context.auth, ...context.propsValue });
	},
});
