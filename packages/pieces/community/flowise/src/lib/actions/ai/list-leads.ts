import { createAction } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseListLeadsOutputSchema } from '../../output-schemas';

export const listLeadsAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_list_leads',
	outputSchema: flowiseListLeadsOutputSchema,
	displayName: 'List Leads',
	description: 'Lists the leads captured by a chatflow.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists every lead (name, email, phone) captured by one chatflow, with the chat each came from.',
		idempotent: true,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
	},
	async run(context) {
		const leads = await flowiseApi.listLeads({
			auth: context.auth,
			chatflowId: context.propsValue.chatflowId,
		});
		return { leads, count: leads.length };
	},
});
