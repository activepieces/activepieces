import { HttpMethod } from '@activepieces/pieces-common';

import { zohoBookingsClient } from './client';

import type {
	ZohoBookingsAppointment,
	ZohoBookingsAppointmentsResponse,
	ZohoBookingsAuthValue,
	ZohoBookingsListResponse,
	ZohoBookingsRescheduleResult,
	ZohoBookingsResource,
	ZohoBookingsResponse,
	ZohoBookingsService,
	ZohoBookingsStaff,
	ZohoBookingsWorkspace,
} from './types';

async function listWorkspaces({
	auth,
}: {
	auth: ZohoBookingsAuthValue;
}): Promise<ZohoBookingsWorkspace[]> {
	const response = await zohoBookingsClient.request<
		ZohoBookingsListResponse<ZohoBookingsWorkspace>
	>({
		auth,
		method: HttpMethod.GET,
		path: '/workspaces',
		headers: JSON_HEADERS,
	});
	return response?.response?.returnvalue?.data || [];
}

async function listServices({
	auth,
	workspaceId,
}: {
	auth: ZohoBookingsAuthValue;
	workspaceId?: string;
}): Promise<ZohoBookingsService[]> {
	const response = await zohoBookingsClient.request<ZohoBookingsListResponse<ZohoBookingsService>>({
		auth,
		method: HttpMethod.GET,
		path: '/services',
		headers: JSON_HEADERS,
		query: workspaceId ? { workspace_id: workspaceId } : {},
	});
	return response?.response?.returnvalue?.data || [];
}

async function listResources({
	auth,
	serviceId,
}: {
	auth: ZohoBookingsAuthValue;
	serviceId?: string;
}): Promise<ZohoBookingsResource[]> {
	const response = await zohoBookingsClient.request<ZohoBookingsListResponse<ZohoBookingsResource>>(
		{
			auth,
			method: HttpMethod.GET,
			path: '/resources',
			headers: JSON_HEADERS,
			query: serviceId ? { service_id: serviceId } : {},
		},
	);
	return response?.response?.returnvalue?.data || [];
}

async function listStaff({
	auth,
	serviceId,
}: {
	auth: ZohoBookingsAuthValue;
	serviceId?: string;
}): Promise<ZohoBookingsStaff[]> {
	const response = await zohoBookingsClient.request<ZohoBookingsListResponse<ZohoBookingsStaff>>({
		auth,
		method: HttpMethod.GET,
		path: '/staffs',
		headers: JSON_HEADERS,
		query: serviceId ? { service_id: serviceId } : {},
	});
	return response?.response?.returnvalue?.data || [];
}

async function listAppointments({
	auth,
	fromTime,
}: {
	auth: ZohoBookingsAuthValue;
	fromTime?: string;
}): Promise<ZohoBookingsAppointment[]> {
	const payload: Record<string, string> = {};
	if (fromTime) payload['from_time'] = formatDateTime(fromTime);

	const formData = new FormData();
	formData.append('data', JSON.stringify(payload));
	const response = await zohoBookingsClient.request<ZohoBookingsAppointmentsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/fetchappointment',
		headers: FORM_HEADERS,
		body: formData,
	});

	const appointments = response?.response?.returnvalue?.response;
	return Array.isArray(appointments) ? appointments : [];
}

async function bookAppointment({
	auth,
	serviceId,
	fromTime,
	customerName,
	customerEmail,
	customerPhone,
	staffId,
	resourceId,
	groupId,
	toTime,
	timezone,
	notes,
	additionalFields,
	costPaid,
}: BookAppointmentParams & { auth: ZohoBookingsAuthValue }): Promise<
	ZohoBookingsResponse['response']
> {
	const customer_details = {
		name: String(customerName),
		email: String(customerEmail),
		phone_number: String(customerPhone),
	};
	const formData = new FormData();
	formData.append('service_id', serviceId);
	formData.append('from_time', formatDateTime(fromTime));
	formData.append('customer_details', JSON.stringify(customer_details));

	if (staffId) {
		formData.append('staff_id', staffId);
	}
	if (resourceId) {
		formData.append('resource_id', resourceId);
	}
	if (groupId) {
		formData.append('group_id', groupId);
	}
	if (toTime) {
		formData.append('to_time', formatDateTime(toTime));
	}
	if (timezone) {
		formData.append('timezone', timezone);
	}
	if (notes) {
		formData.append('notes', notes);
	}
	if (additionalFields) {
		formData.append('additional_fields', JSON.stringify(additionalFields));
	}
	if (costPaid) {
		formData.append('payment_info', JSON.stringify({ cost_paid: costPaid.toString() }));
	}

	const response = await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/appointment',
		headers: FORM_HEADERS,
		body: formData,
	});

	if (response.response.status === 'failure') {
		throw new Error(`${response.response.errormessage}`);
	}
	return response.response;
}

async function cancelAppointment({
	auth,
	bookingId,
}: {
	auth: ZohoBookingsAuthValue;
	bookingId: string;
}): Promise<ZohoBookingsResponse> {
	const formData = new FormData();
	formData.append('booking_id', bookingId);
	formData.append('action', 'cancel');

	return await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/updateappointment',
		headers: LEGACY_FORM_HEADERS,
		body: formData,
	});
}

async function getAvailableSlots({
	auth,
	serviceId,
	selectedDate,
	staffId,
	groupId,
	resourceId,
}: GetAvailableSlotsParams & { auth: ZohoBookingsAuthValue }): Promise<ZohoBookingsResponse> {
	const query: Record<string, string> = {
		service_id: serviceId,
		selected_date: formatDate(selectedDate),
	};
	if (staffId) {
		query['staff_id'] = staffId;
	}
	if (groupId) {
		query['group_id'] = groupId;
	}
	if (resourceId) {
		query['resource_id'] = resourceId;
	}

	return await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/availableslots',
		query,
	});
}

async function getAppointment({
	auth,
	bookingId,
}: {
	auth: ZohoBookingsAuthValue;
	bookingId: string;
}): Promise<ZohoBookingsResponse> {
	return await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getappointment',
		query: { booking_id: bookingId },
	});
}

async function rescheduleAppointment({
	auth,
	bookingId,
	staffId,
	groupId,
	startTime,
}: RescheduleAppointmentParams & {
	auth: ZohoBookingsAuthValue;
}): Promise<ZohoBookingsResponse<ZohoBookingsRescheduleResult>['response']> {
	const formData = new FormData();
	formData.append('booking_id', bookingId);
	if (staffId) {
		formData.append('staff_id', staffId);
	}
	if (groupId) {
		formData.append('group_id', groupId);
	}
	if (startTime) {
		formData.append('start_time', formatDateTime(startTime));
	}

	const response = await zohoBookingsClient.request<
		ZohoBookingsResponse<ZohoBookingsRescheduleResult>
	>({
		auth,
		method: HttpMethod.POST,
		path: '/rescheduleappointment',
		headers: LEGACY_FORM_HEADERS,
		body: formData,
	});

	const responseBody = response.response;
	if (responseBody.status !== 'success') {
		throw new Error(`Failed to reschedule appointment: ${responseBody.message || 'Unknown error'}`);
	}
	if (responseBody.returnvalue.Status == 'failure') {
		throw new Error(responseBody.returnvalue.message || 'Failed to reschedule appointment');
	}
	return responseBody;
}

function formatDateTime(date: string): string {
	const d = new Date(date);
	const day = d.getDate().toString().padStart(2, '0');
	const month = MONTHS[d.getMonth()];
	const year = d.getFullYear();
	const hours = d.getHours().toString().padStart(2, '0');
	const minutes = d.getMinutes().toString().padStart(2, '0');
	const seconds = d.getSeconds().toString().padStart(2, '0');
	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function formatDate(date: string): string {
	const d = new Date(date);
	const year = d.getFullYear();
	const month = (d.getMonth() + 1).toString().padStart(2, '0');
	const day = d.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export const zohoBookingsApi = {
	listWorkspaces,
	listServices,
	listResources,
	listStaff,
	listAppointments,
	bookAppointment,
	cancelAppointment,
	getAvailableSlots,
	getAppointment,
	rescheduleAppointment,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };
const LEGACY_FORM_HEADERS = { contentType: 'application/x-www-form-urlencoded' };

type BookAppointmentParams = {
	serviceId: string;
	fromTime: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	staffId?: string;
	resourceId?: string;
	groupId?: string;
	toTime?: string;
	timezone?: string;
	notes?: string;
	additionalFields?: unknown;
	costPaid?: number;
};

type GetAvailableSlotsParams = {
	serviceId: string;
	selectedDate: string;
	staffId?: string;
	groupId?: string;
	resourceId?: string;
};

type RescheduleAppointmentParams = {
	bookingId: string;
	staffId?: string;
	groupId?: string;
	startTime?: string;
};
