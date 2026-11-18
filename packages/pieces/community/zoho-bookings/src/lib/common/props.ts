import { DropdownState, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../auth';
import { zohoBookingsApi } from './api';

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace',
	description = 'Select the workspace',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Authentication required' });
			}
			try {
				const workspaces = await zohoBookingsApi.listWorkspaces({ auth });
				return {
					disabled: false,
					options: workspaces.map((workspace) => ({
						label: workspace.name,
						value: workspace.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load workspaces' });
			}
		},
	});
}

function serviceId<R extends boolean>({
	required,
	displayName = 'Service',
	description = 'Select the service',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: ['workspace_id'],
		options: async ({ auth, workspace_id }) => {
			if (!workspace_id || !auth) {
				return disabledOptions({ placeholder: 'Please enter workspace ID first' });
			}
			try {
				const services = await zohoBookingsApi.listServices({
					auth,
					workspaceId: String(workspace_id),
				});
				return {
					disabled: false,
					options: services.map((service) => ({
						label: `${service.name} (${service.duration})`,
						value: service.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load services' });
			}
		},
	});
}

function anyServiceId<R extends boolean>({
	required,
	displayName = 'Service (Optional)',
	description = 'Select service to filter staff options',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Authentication required' });
			}
			try {
				const services = await zohoBookingsApi.listServices({ auth });
				return {
					disabled: false,
					options: services.map((service) => ({
						label: `${service.name} (${service.duration})`,
						value: service.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load services' });
			}
		},
	});
}

function staffId<R extends boolean>({
	required,
	displayName = 'Staff',
	description = 'Select the staff member',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: ['service_id'],
		options: async ({ auth, service_id }) => {
			if (!service_id || !auth) {
				return disabledOptions({ placeholder: 'Please select service first' });
			}
			try {
				const staff = await zohoBookingsApi.listStaff({
					auth,
					serviceId: String(service_id),
				});
				return {
					disabled: false,
					options: staff.map((member) => ({
						label: `${member.name} - ${member.designation || 'Staff'}`,
						value: member.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load staff' });
			}
		},
	});
}

function anyStaffId<R extends boolean>({
	required,
	displayName = 'Staff',
	description = 'Select the staff member',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: ['service_id'],
		options: async ({ auth, service_id }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Authentication required' });
			}
			try {
				const staff = await zohoBookingsApi.listStaff({
					auth,
					serviceId: service_id ? String(service_id) : undefined,
				});
				return {
					disabled: false,
					options: staff.map((member) => ({
						label: `${member.name} - ${member.designation || 'Staff'}`,
						value: member.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load staff' });
			}
		},
	});
}

function resourceId<R extends boolean>({
	required,
	displayName = 'Resource',
	description = 'Select the resource (use this OR staff_id OR group_id)',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: ['service_id'],
		options: async ({ auth, service_id }) => {
			if (!service_id || !auth) {
				return disabledOptions({ placeholder: 'Please select service first' });
			}
			try {
				const resources = await zohoBookingsApi.listResources({
					auth,
					serviceId: String(service_id),
				});
				return {
					disabled: false,
					options: resources.map((resource) => ({
						label: resource.name,
						value: resource.id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load resources' });
			}
		},
	});
}

function bookingId<R extends boolean>({
	required,
	displayName = 'Appointment',
	description = 'Select the appointment to get details for',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: zohoBookingsAuth,
		displayName,
		description,
		required,
		refreshers: ['from_time', 'to_time'],
		options: async ({ auth, from_time }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Authentication required' });
			}
			if (!from_time) {
				return disabledOptions({ placeholder: 'Please select From Time first' });
			}
			try {
				const appointments = await zohoBookingsApi.listAppointments({
					auth,
					fromTime: String(from_time),
				});
				return {
					disabled: false,
					options: appointments.map((appointment) => ({
						label: `${appointment.booking_id} - ${appointment.customer_name} (${appointment.service_name}) - ${appointment.start_time} [${appointment.status}]`,
						value: appointment.booking_id,
					})),
				};
			} catch (error) {
				return disabledOptions({ placeholder: 'Failed to load appointments' });
			}
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const zohoBookingsProps = {
	workspaceId,
	serviceId,
	anyServiceId,
	staffId,
	anyStaffId,
	resourceId,
	bookingId,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
