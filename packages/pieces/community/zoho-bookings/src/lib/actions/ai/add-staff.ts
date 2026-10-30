import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsAddStaffOutputSchema } from '../../output-schemas';

export const zohoBookingsAddStaffAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_add_staff',
	outputSchema: zohoBookingsAddStaffOutputSchema,
	displayName: 'Add Staff',
	description: 'Add a staff member to the account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Add a staff member (name and email) and optionally assign services. Needs an Admin or Super Admin connection, uses one of the plan's staff seats, and staff can't be removed through the API. Returns the new staff ID, name and email; a newly added staff member may not appear in List Staff right away. Fails if the email already exists. Not idempotent.",
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		email: Property.ShortText({ displayName: 'Email', required: true }),
		role: Property.StaticDropdown({
			displayName: 'Role',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Admin', value: 'Admin' },
					{ label: 'Manager', value: 'Manager' },
					{ label: 'Staff', value: 'Staff' },
				],
			},
		}),
		designation: Property.ShortText({
			displayName: 'Designation',
			description: 'Job title, e.g. "Consultant".',
			required: false,
		}),
		phone: Property.ShortText({ displayName: 'Phone', required: false }),
		gender: Property.ShortText({ displayName: 'Gender', required: false }),
		dob: zohoBookingsAiProps.dateTime({ required: false, displayName: 'Date of Birth' }),
		additionalInfo: Property.LongText({ displayName: 'Additional Info', required: false }),
		serviceIds: Property.Array({
			displayName: 'Service IDs',
			description: 'Services to assign. Use List Services.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.addStaff({ auth, ...propsValue });
	},
});
