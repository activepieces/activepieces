import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { changedClientOutputSchema } from '../../output-schemas';

export const deleteClientAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_client',
	outputSchema: changedClientOutputSchema,
	displayName: 'Delete Client',
	description: 'Deletes an archived client.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a client. Clockify only deletes archived clients, so archive it first with Update Client. Its projects stay, without a client.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		clientId: clockifyAiProps.clientId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteClient({
			auth,
			workspaceId: propsValue.workspaceId,
			clientId: propsValue.clientId,
		});
	},
});
