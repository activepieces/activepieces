import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { deleteAgentOutputSchema } from '../output-schemas';

export const deleteAgent = createAction({
	auth: mistralAuth,
	name: 'delete_agent',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Agent',
	description: 'Permanently delete a Mistral agent (Beta).',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Mistral agent (Beta) and all its versions by agent id; conversations can no longer be started with it. Confirm the id with Get Agent or List Agents first. Not idempotent: a repeat call fails because the agent is gone.',
		idempotent: false,
	},
	outputSchema: deleteAgentOutputSchema,
	props: {
		agent_id: Property.ShortText({
			displayName: 'Agent ID',
			description: 'The agent id (usually starts with ag_), from List Agents.',
			required: true,
		}),
	},
	async run(context) {
		const { agent_id } = context.propsValue;
		await mistralApi.call<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/agents/${encodeURIComponent(agent_id)}`,
		});
		return { agent_id, deleted: true };
	},
});
