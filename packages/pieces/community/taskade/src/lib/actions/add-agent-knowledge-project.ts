import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeOutputSchemas } from '../output-schemas';

export const addAgentKnowledgeProjectAction = createAction({
	auth: taskadeAuth,
	name: 'add_agent_knowledge_project',
	displayName: 'Add Project to Agent Knowledge',
	description: 'Lets an AI agent use a project as knowledge.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Adds a Taskade project to an AI agent\'s knowledge so the agent can read it when answering. Adding a project that is already linked leaves it linked, so it is idempotent.',
		idempotent: true,
	},
	props: {
		agentId: taskadeAiProps.agentId(),
		projectId: taskadeAiProps.projectId(),
	},
	outputSchema: taskadeOutputSchemas['agentKnowledge'],
	async run(context) {
		const agentId = taskadeApi.requireText({ value: context.propsValue.agentId, label: 'Agent ID' });
		const projectId = taskadeApi.parseProjectId(context.propsValue.projectId);
		await taskadeApi.request({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/agents/${taskadeApi.seg({ value: agentId, label: 'Agent ID' })}/knowledge/project`,
			operation: 'add project to agent knowledge',
			body: { projectId },
		});
		return { agentId, projectId, linked: true };
	},
});
