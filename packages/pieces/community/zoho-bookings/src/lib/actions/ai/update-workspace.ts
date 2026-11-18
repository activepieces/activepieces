import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateWorkspaceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_workspace',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Update Workspace',
	description: "Update a workspace's name, status, description or settings.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Change a workspace's name, status (active or inactive), description, notification senders or policies. Only the fields you pass change; at least one is required. Use List Workspaces for the ID.",
		idempotent: true,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({ required: true }),
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
		description: Property.LongText({
			displayName: 'Description',
			description: 'Up to 2000 characters.',
			required: false,
		}),
		mailNotifications: Property.Json({
			displayName: 'Mail Notifications',
			description:
				'Sender settings, e.g. {"customer": {"email": "business", "replyto": "superadmin", "cc": "staff"}, "staff": {"email": "bookings", "replyto": "customer"}}.',
			required: false,
		}),
		policiesAndPreferences: Property.Json({
			displayName: 'Policies and Preferences',
			description:
				'Workspace policies, e.g. {"scheduling_interval": 15, "customer_select_staff": "true", "prefix": "LA", "minimum_booking_notice": 30, "enable_cancel": "true"}.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const changes = {
			...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
			...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
			...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
			...(propsValue.mailNotifications !== undefined
				? { mail_notifications: propsValue.mailNotifications }
				: {}),
			...(propsValue.policiesAndPreferences !== undefined
				? { policies_and_preferences: propsValue.policiesAndPreferences }
				: {}),
		};
		if (Object.keys(changes).length === 0) {
			throw new Error('Provide at least one field to update.');
		}
		return await zohoBookingsApi.updateWorkspace({
			auth,
			workspaceId: propsValue.workspaceId,
			changes,
		});
	},
});
