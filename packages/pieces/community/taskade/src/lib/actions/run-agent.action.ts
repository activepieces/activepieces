import { taskadeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const runAgentAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-run-agent',
	displayName: 'Run AI Agent',
	description: 'Sends a prompt to a Taskade AI agent and returns its response.',
	props: {
		space_id: taskadeProps.space_id,
		agent_id: taskadeProps.agent_id,
		prompt: Property.LongText({
			displayName: 'Prompt',
			required: true,
		}),
	},
	async run(context) {
		const { space_id, agent_id, prompt } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.runAgent({
			spaceId: space_id,
			agentId: agent_id,
			prompt,
		});
	},
});
