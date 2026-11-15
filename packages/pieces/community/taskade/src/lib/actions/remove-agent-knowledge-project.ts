import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeOutputSchemas } from '../output-schemas';

export const removeAgentKnowledgeProjectAction = createAction({
	auth: taskadeAuth,
	name: 'remove_agent_knowledge_project',
	displayName: 'Remove Project from Agent Knowledge',
	description: 'Stops an AI agent from using a project as knowledge.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Removes a Taskade project from an AI agent\'s knowledge; the project itself is not changed. Removing a project that is not linked also succeeds, so it is idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['agentKnowledge'],
	async run(context) {
		const token = context.auth.secret_text;
		const agentId = taskadeApi.requireText({ value: context.propsValue.agentId, label: 'Agent ID' });
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		const agentPath = `/agents/${taskadeApi.seg({ value: agentId, label: 'Agent ID' })}`;
		try {
			await taskadeApi.request({
				token,
				method: HttpMethod.DELETE,
				path: `${agentPath}/knowledge/project/${taskadeApi.seg({ value: projectId, label: 'Project ID' })}`,
				operation: 'remove project from agent knowledge',
			});
			return { agentId, projectId, linked: false };
		} catch (error) {
			if (!taskadeApi.isNotFound(error)) {
				throw error;
			}
			await taskadeApi.request({ token, method: HttpMethod.GET, path: agentPath, operation: 'get agent' });
			return { agentId, projectId, linked: false };
		}
	},
});
