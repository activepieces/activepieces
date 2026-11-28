import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { aiInput, aiOutput } from '../../common/ai-props';
import { taskAiOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const completeTaskAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_complete_task',
	classification: 'WRITE',
	displayName: 'Complete Task',
	description: 'Marks a task as complete.',
	audience: 'ai',
	aiMetadata: {
		description: 'Marks a contact or deal task as complete by task ID (returned by Create Task or the task triggers). Safe to repeat: a completed task stays complete.',
		idempotent: true,
	},
	outputSchema: taskAiOutputSchema,
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', required: true }),
	},
	async run({ auth, propsValue }) {
		const taskId = aiInput.numericId({ value: propsValue.task_id, label: 'Task ID' });
		const response = await makeClient(auth.props).request({
			method: 'PUT',
			path: `/dealTasks/${activeCampaignApi.segment(taskId)}`,
			body: { dealTask: { status: 1 } },
		});
		return aiOutput.taskSummary(acData.recordAt({ value: response.body, key: 'dealTask' }));
	},
});
