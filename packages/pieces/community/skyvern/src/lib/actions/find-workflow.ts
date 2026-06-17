import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';
import { ListWorkflowResponse } from '../common/props';

export const findWorkflowAction = createAction({
	auth: skyvernAuth,
	name: 'find-workflow',
	displayName: 'Find Workflow',
	description: 'Finds workflow based on title.',
	audience: 'both',
	aiMetadata: { description: 'Searches Skyvern workflows by title, paging through all results and returning every match. Use to resolve a workflow title into its workflow ID before calling Run Workflow. Read-only and idempotent.', idempotent: true },
	props: {
		title: Property.ShortText({
			displayName: 'Workflow Title',
			required: true,
		}),
	},
	async run(context) {
		const { title } = context.propsValue;

		let hasMore = true;
		let page = 1;
		const workflows = [];

		do {
			const response = await skyvernApiCall<ListWorkflowResponse[]>({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: '/workflows',
				query: {
					page_size: 100,
					page,
					title,
				},
			});

			if (isNil(response) || !Array.isArray(response)) break;
			workflows.push(...response);

			hasMore = response.length > 0;
			page++;
		} while (hasMore);

		return {
			found: workflows.length > 0,
			result: workflows,
		};
	},
});
