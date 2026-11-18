import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsUpdateResourceOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateResourceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_resource',
	outputSchema: zohoBookingsUpdateResourceOutputSchema,
	displayName: 'Update Resource',
	description: 'Update a resource.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Change a resource's name, status, description, workspaces, services or person in charge. Only the fields you pass change; the workspace and service lists replace the current ones. Use List Resources for the ID.",
		idempotent: true,
	},
	props: {
		resourceId: zohoBookingsAiProps.resourceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'in_active' },
				],
			},
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		workspaceIds: Property.Array({
			displayName: 'Workspace IDs',
			description: 'Use List Workspaces.',
			required: false,
		}),
		serviceIds: Property.Array({
			displayName: 'Service IDs',
			description: 'Use List Services.',
			required: false,
		}),
		userInCharge: Property.ShortText({
			displayName: 'User in Charge',
			description: 'Email of the staff member in charge of the resource.',
			required: false,
		}),
		ignorePastAppointments: Property.Checkbox({
			displayName: 'Update Past Appointments',
			description: 'Also apply the new details to past appointments. Defaults to false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.updateResource({ auth, ...propsValue });
	},
});
