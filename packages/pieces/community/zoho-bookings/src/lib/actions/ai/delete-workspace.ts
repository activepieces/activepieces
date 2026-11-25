import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsDeleteWorkspaceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_delete_workspace',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Delete Workspace',
	description: 'Permanently delete a workspace.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete a workspace by ID. Fails while it has future appointments or a booked group service; by default it also fails when it has past appointments. To hide a workspace instead, set its status to inactive with Update Workspace.',
		idempotent: false,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({ required: true }),
		ignorePastAppointments: Property.Checkbox({
			displayName: 'Delete Even With Past Appointments',
			description: 'Delete the workspace even if it has past appointments. Defaults to false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.deleteWorkspace({
			auth,
			workspaceId: propsValue.workspaceId,
			ignorePastAppointments: propsValue.ignorePastAppointments,
		});
	},
});
