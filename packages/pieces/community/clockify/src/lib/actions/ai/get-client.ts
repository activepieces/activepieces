import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clientOutputSchema } from '../../output-schemas';

export const getClientAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_client',
	outputSchema: clientOutputSchema,
	displayName: 'Get Client',
	description: 'Gets a client by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one Clockify client by ID: name, email, address, note, currency and archived state.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		clientId: clockifyAiProps.clientId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getClient({
			auth,
			workspaceId: propsValue.workspaceId,
			clientId: propsValue.clientId,
		});
	},
});
