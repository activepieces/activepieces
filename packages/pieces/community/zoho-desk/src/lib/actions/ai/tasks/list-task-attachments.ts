import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTaskAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_task_attachments',
	outputSchema: zohoDeskListAccountAttachmentsOutputSchema,
	displayName: 'List Task Attachments',
	description: 'Lists the files attached to a task.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached to one task, with name, size and download link (`href`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, taskId, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listTaskAttachments({
			auth: context.auth,
			orgId,
			taskId,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
