import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListStaffOutputSchema } from '../../output-schemas';

export const zohoBookingsListStaffAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_staff',
	outputSchema: zohoBookingsListStaffOutputSchema,
	displayName: 'List Staff',
	description: 'List staff members, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List staff members with their IDs, emails and roles, optionally filtered by workspace, by a service they offer, by staff ID, or by email ("contains" match). Staff IDs are needed by Book Appointment, Get Available Slots and List Appointments.',
		idempotent: true,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({ required: false }),
		serviceId: zohoBookingsAiProps.serviceId({
			required: false,
			description: 'Only staff who offer this service.',
		}),
		staffId: zohoBookingsAiProps.staffId({
			required: false,
			description: 'Return only this staff member.',
		}),
		staffEmail: Property.ShortText({
			displayName: 'Staff Email',
			description: 'Only staff whose email contains this text.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const staff = await zohoBookingsApi.listStaff({
			auth,
			workspaceId: propsValue.workspaceId,
			serviceId: propsValue.serviceId,
			staffId: propsValue.staffId,
			staffEmail: propsValue.staffEmail,
		});
		return { staff, count: staff.length };
	},
});
