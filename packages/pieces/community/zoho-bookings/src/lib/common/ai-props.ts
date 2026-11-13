import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function bookingId<R extends boolean>({
	required,
	displayName = 'Booking ID',
	description = 'Booking ID of the appointment, e.g. "#AN-00014". Use List Appointments or the result of Book Appointment to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace ID',
	description = 'Workspace ID, e.g. "4512401000000032020". Use List Workspaces to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function serviceId<R extends boolean>({
	required,
	displayName = 'Service ID',
	description = 'Service ID, e.g. "4512401000000032056". Use List Services to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function staffId<R extends boolean>({
	required,
	displayName = 'Staff ID',
	description = 'Staff member ID. Use List Staff to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function resourceId<R extends boolean>({
	required,
	displayName = 'Resource ID',
	description = 'Resource ID. Use List Resources to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function groupId<R extends boolean>({
	required,
	displayName = 'Group ID',
	description = 'Staff group ID for a collective-booking service, as shown in Zoho Bookings.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function dateTime<R extends boolean>({
	required,
	displayName,
	description,
}: PropParams<R> & { displayName: string }) {
	return Property.DateTime({
		displayName,
		description: `${
			description ?? ''
		} ISO 8601 without an offset, e.g. 2026-11-03T14:30:00; sent to Zoho as that wall-clock time.`.trim(),
		required,
	});
}

function serviceFields() {
	return {
		duration: Property.Number({ displayName: 'Duration (minutes)', required: false }),
		cost: Property.Number({ displayName: 'Cost', required: false }),
		preBuffer: Property.Number({ displayName: 'Buffer Before (minutes)', required: false }),
		postBuffer: Property.Number({ displayName: 'Buffer After (minutes)', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		staffIds: Property.Array({
			displayName: 'Staff IDs',
			description: 'Staff to assign. Use List Staff.',
			required: false,
		}),
		meetingMode: Property.StaticDropdown({
			displayName: 'Meeting Mode',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Online', value: 'online' },
					{ label: 'Offline', value: 'offline' },
				],
			},
		}),
		meetingType: Property.ShortText({
			displayName: 'Meeting Type',
			description:
				'Required when Meeting Mode is online: zohomeeting, zoom, teams or gmeet. When offline: an in-person location of the workspace, or empty.',
			required: false,
		}),
	};
}

function customerFields() {
	return {
		name: Property.ShortText({
			displayName: 'Name',
			description:
				'Full name. Use this when the account stores a single name field; otherwise use First Name and Last Name.',
			required: false,
		}),
		firstName: Property.ShortText({ displayName: 'First Name', required: false }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
		email: Property.ShortText({ displayName: 'Email', required: false }),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'With country code, e.g. "+11345678901".',
			required: false,
		}),
	};
}

function availabilityFor<R extends boolean>({
	required,
	displayName = 'Applies To',
	description = 'Whose availability the overrides belong to.',
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: 'Business', value: 'business' },
				{ label: 'Staff member', value: 'staff' },
				{ label: 'Resource', value: 'resource' },
			],
		},
	});
}

export const zohoBookingsAiProps = {
	bookingId,
	workspaceId,
	serviceId,
	staffId,
	resourceId,
	groupId,
	dateTime,
	serviceFields,
	customerFields,
	availabilityFor,
};
