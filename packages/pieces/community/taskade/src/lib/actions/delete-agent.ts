import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeOutputSchemas } from '../output-schemas';

export const deleteAgentAction = createAction({
	auth: taskadeAuth,
	name: 'delete_agent',
	displayName: 'Delete AI Agent',
	description: 'Permanently deletes an AI agent.',
	classification: 'DESTRUCTIVE',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes one Taskade AI agent by ID, including its commands and settings; it cannot be undone. Use only when the user asks. A repeat call finds it gone and reports alreadyDeleted=true, so it is idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
	},
	outputSchema: taskadeOutputSchemas['deleteAgent'],
	async run(context) {
		const agentId = taskadeApi.requireText({ value: context.propsValue.agentId, label: 'Agent ID' });
		try {
			await taskadeApi.request({
				token: context.auth.secret_text,
				method: HttpMethod.DELETE,
				path: `/agents/${taskadeApi.seg({ value: agentId, label: 'Agent ID' })}`,
				operation: 'delete agent',
			});
			return { agentId, deleted: true, alreadyDeleted: false };
		} catch (error) {
			if (taskadeApi.isNotFound(error)) {
				return { agentId, deleted: true, alreadyDeleted: true };
			}
			throw error;
		}
	},
});
