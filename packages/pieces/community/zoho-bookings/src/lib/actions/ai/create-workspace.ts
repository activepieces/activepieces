import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCreatedRecordOutputSchema } from '../../output-schemas';

export const zohoBookingsCreateWorkspaceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_create_workspace',
	outputSchema: zohoBookingsCreatedRecordOutputSchema,
	displayName: 'Create Workspace',
	description: 'Create a new workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create a workspace with a name. Returns the new workspace ID. The account plan limits how many workspaces can exist. Not idempotent.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: '2-50 characters, without |/\\,?{}<>:;"\'` characters.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.createWorkspace({ auth, name: propsValue.name });
	},
});
