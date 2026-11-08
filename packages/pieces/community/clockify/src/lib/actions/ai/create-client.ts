import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clientOutputSchema } from '../../output-schemas';

export const createClientAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_client',
	outputSchema: clientOutputSchema,
	displayName: 'Create Client',
	description: 'Creates a client in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a client in a Clockify workspace and returns it with its ID, to attach projects to. Not idempotent: client names must be unique, so a repeat fails.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Client name, unique in the workspace.',
			required: true,
		}),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		address: Property.LongText({ displayName: 'Address', required: false }),
		note: Property.LongText({ displayName: 'Note', required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createClient({
			auth,
			workspaceId: propsValue.workspaceId,
			client: {
				name: propsValue.name,
				email: propsValue.email,
				address: propsValue.address,
				note: propsValue.note,
			},
		});
	},
});
