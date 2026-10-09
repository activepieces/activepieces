import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseAiProps } from '../../common/ai-props';
import { flowiseApi } from '../../common/api';
import { flowiseLeadOutputSchema } from '../../output-schemas';

export const createLeadAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_lead',
	outputSchema: flowiseLeadOutputSchema,
	displayName: 'Create Lead',
	description: 'Adds a lead to a chatflow.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a lead (name, email, phone) to a chatflow, optionally linked to a chat session. Each call creates another lead.',
		idempotent: false,
	},
	props: {
		chatflowId: flowiseAiProps.chatflowId({ required: true }),
		chatId: flowiseAiProps.chatId({
			required: false,
			description: 'Chat session the lead came from. Flowise generates one when empty.',
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the lead.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email of the lead.',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number of the lead.',
			required: false,
		}),
	},
	async run(context) {
		const { chatflowId, chatId, name, email, phone } = context.propsValue;
		return await flowiseApi.createLead({
			auth: context.auth,
			fields: { chatflowid: chatflowId, chatId, name, email, phone },
		});
	},
});
