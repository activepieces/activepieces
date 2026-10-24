import { HttpMethod } from '@activepieces/pieces-common';

import { zohoBookingsClient } from './client';

import type {
	ZohoBookingsAppointment,
	ZohoBookingsAppointmentsPage,
	ZohoBookingsAuthValue,
	ZohoBookingsBatchResult,
	ZohoBookingsDateOverridesPage,
	ZohoBookingsRescheduleResult,
	ZohoBookingsResource,
	ZohoBookingsResponse,
	ZohoBookingsResult,
	ZohoBookingsService,
	ZohoBookingsStatusResult,
	ZohoBookingsStaff,
	ZohoBookingsWorkspace,
} from './types';

async function listWorkspaces({
	auth,
	workspaceId,
}: {
	auth: ZohoBookingsAuthValue;
	workspaceId?: string;
}): Promise<ZohoBookingsWorkspace[]> {
	return await list<ZohoBookingsWorkspace>({
		auth,
		path: '/workspaces',
		query: { ...(workspaceId ? { workspace_id: workspaceId } : {}) },
	});
}

async function listServices({
	auth,
	workspaceId,
	serviceId,
	staffId,
}: {
	auth: ZohoBookingsAuthValue;
	workspaceId?: string;
	serviceId?: string;
	staffId?: string;
}): Promise<ZohoBookingsService[]> {
	return await list<ZohoBookingsService>({
		auth,
		path: '/services',
		query: {
			...(workspaceId ? { workspace_id: workspaceId } : {}),
			...(serviceId ? { service_id: serviceId } : {}),
			...(staffId ? { staff_id: staffId } : {}),
		},
	});
}

async function listResources({
	auth,
	serviceId,
	resourceId,
}: {
	auth: ZohoBookingsAuthValue;
	serviceId?: string;
	resourceId?: string;
}): Promise<ZohoBookingsResource[]> {
	return await list<ZohoBookingsResource>({
		auth,
		path: '/resources',
		query: {
			...(serviceId ? { service_id: serviceId } : {}),
			...(resourceId ? { resource_id: resourceId } : {}),
		},
	});
}

async function listStaff({
	auth,
	serviceId,
	staffId,
	staffEmail,
	workspaceId,
}: {
	auth: ZohoBookingsAuthValue;
	serviceId?: string;
	staffId?: string;
	staffEmail?: string;
	workspaceId?: string;
}): Promise<ZohoBookingsStaff[]> {
	return await list<ZohoBookingsStaff>({
		auth,
		path: '/staffs',
		query: {
			...(serviceId ? { service_id: serviceId } : {}),
			...(staffId ? { staff_id: staffId } : {}),
			...(staffEmail ? { staff_email: staffEmail } : {}),
			...(workspaceId ? { workspace_id: workspaceId } : {}),
		},
	});
}

async function listAppointments({
	auth,
	fromTime,
}: {
	auth: ZohoBookingsAuthValue;
	fromTime?: string;
}): Promise<ZohoBookingsAppointment[]> {
	const result = await searchAppointments({ auth, fromTime });
	const appointments = result.response;
	return Array.isArray(appointments) ? appointments : [];
}

async function searchAppointments({
	auth,
	serviceId,
	staffId,
	resourceId,
	fromTime,
	toTime,
	status,
	page,
	perPage,
	includeCustomFields,
	customerName,
	customerEmail,
	customerPhone,
	createdFrom,
	createdTill,
}: SearchAppointmentsParams & {
	auth: ZohoBookingsAuthValue;
}): Promise<ZohoBookingsAppointmentsPage> {
	const filters: Record<string, string | number> = {
		...(serviceId ? { service_id: serviceId } : {}),
		...(staffId ? { staff_id: staffId } : {}),
		...(resourceId ? { resource_id: resourceId } : {}),
		...(fromTime ? { from_time: formatDateTime(fromTime) } : {}),
		...(toTime ? { to_time: formatDateTime(toTime) } : {}),
		...(status ? { status } : {}),
		...(page !== undefined ? { page } : {}),
		...(perPage !== undefined ? { per_page: perPage } : {}),
		...(includeCustomFields ? { need_customer_more_info: 'true' } : {}),
		...(customerName ? { customer_name: customerName } : {}),
		...(customerEmail ? { customer_email: customerEmail } : {}),
		...(customerPhone ? { customer_phone_number: customerPhone } : {}),
		...(createdFrom ? { appointment_created_from: formatDateTime(createdFrom) } : {}),
		...(createdTill ? { appointment_created_till: formatDateTime(createdTill) } : {}),
	};
	const formData = new FormData();
	formData.append('data', JSON.stringify(filters));
	const response = await zohoBookingsClient.request<
		ZohoBookingsResponse<ZohoBookingsAppointmentsPage>
	>({
		auth,
		method: HttpMethod.POST,
		path: '/fetchappointment',
		headers: FORM_HEADERS,
		body: formData,
	});
	assertSuccess({ response });
	return response.response.returnvalue;
}

async function updateAppointment({
	auth,
	bookingId,
	action,
	data,
}: {
	auth: ZohoBookingsAuthValue;
	bookingId: string;
	action: string;
	data?: Record<string, unknown>;
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/updateappointment',
		fields: {
			booking_id: bookingId,
			action,
			...(data ? { data: JSON.stringify(data) } : {}),
		},
	});
}

async function createWorkspace({
	auth,
	name,
}: {
	auth: ZohoBookingsAuthValue;
	name: string;
}): Promise<{ id?: string; name: string }> {
	const result = await postForm<{ data?: { id?: string } }>({
		auth,
		path: '/createworkspace',
		fields: { name },
	});
	return { id: result.data?.id, name };
}

async function updateWorkspace({
	auth,
	workspaceId,
	changes,
}: {
	auth: ZohoBookingsAuthValue;
	workspaceId: string;
	changes: Record<string, unknown>;
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/updateworkspace',
		fields: { workspaceId, dataMap: JSON.stringify(changes) },
	});
}

async function deleteWorkspace({
	auth,
	workspaceId,
	ignorePastAppointments,
}: {
	auth: ZohoBookingsAuthValue;
	workspaceId: string;
	ignorePastAppointments?: boolean;
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/deleteworkspace',
		fields: {
			workspaceId,
			...(ignorePastAppointments !== undefined
				? { ignorePastAppointment: String(ignorePastAppointments) }
				: {}),
		},
	});
}

async function createService({
	auth,
	workspaceId,
	name,
	serviceType,
	resourceIds,
	...details
}: CreateServiceParams & { auth: ZohoBookingsAuthValue }): Promise<{ id?: string; name: string }> {
	const service = {
		name,
		workspace_id: workspaceId,
		...(serviceType !== undefined ? { service_type: serviceType } : {}),
		...serviceDetails(details),
		...(resourceIds !== undefined ? { assigned_resources: resourceIds } : {}),
	};
	const result = await postForm<{ data?: { id?: string } }>({
		auth,
		path: '/createservice',
		fields: { data: JSON.stringify(service) },
	});
	return { id: result.data?.id, name };
}

async function updateService({
	auth,
	serviceId,
	name,
	status,
	...details
}: UpdateServiceParams & { auth: ZohoBookingsAuthValue }): Promise<ZohoBookingsResult> {
	const service = {
		id: serviceId,
		...(name !== undefined ? { name } : {}),
		...(status !== undefined ? { status } : {}),
		...serviceDetails(details),
	};
	return await postForm({ auth, path: '/editservice', fields: { data: JSON.stringify(service) } });
}

async function deleteService({
	auth,
	serviceId,
}: {
	auth: ZohoBookingsAuthValue;
	serviceId: string;
}): Promise<ZohoBookingsResult> {
	return await postForm({ auth, path: '/deleteservice', fields: { id: serviceId } });
}

async function addStaff({
	auth,
	name,
	email,
	role,
	gender,
	dob,
	phone,
	designation,
	additionalInfo,
	serviceIds,
}: AddStaffParams & { auth: ZohoBookingsAuthValue }): Promise<Record<string, unknown>> {
	const staff = {
		name,
		email,
		...(role !== undefined ? { role } : {}),
		...(gender !== undefined ? { gender } : {}),
		...(dob !== undefined ? { dob: formatDateTime(dob) } : {}),
		...(phone !== undefined ? { phone } : {}),
		...(designation !== undefined ? { designation } : {}),
		...(additionalInfo !== undefined ? { additional_info: additionalInfo } : {}),
		...(serviceIds !== undefined ? { assigned_services: serviceIds } : {}),
	};
	const result = await postForm<ZohoBookingsBatchResult>({
		auth,
		path: '/addstaff',
		fields: { staffMap: JSON.stringify({ data: [staff] }) },
	});
	return firstBatchItem({ result });
}

async function createResource({
	auth,
	name,
	description,
	workspaceIds,
}: {
	auth: ZohoBookingsAuthValue;
	name: string;
	description?: string;
	workspaceIds: unknown[];
}): Promise<Record<string, unknown>> {
	const resource = {
		name,
		...(description !== undefined ? { description } : {}),
		assigned_workspaces: workspaceIds,
	};
	const result = await postForm<ZohoBookingsBatchResult>({
		auth,
		path: '/addresource',
		fields: { resourceMap: JSON.stringify({ data: [resource] }) },
	});
	return firstBatchItem({ result });
}

async function updateResource({
	auth,
	resourceId,
	name,
	status,
	description,
	workspaceIds,
	serviceIds,
	userInCharge,
	ignorePastAppointments,
}: UpdateResourceParams & { auth: ZohoBookingsAuthValue }): Promise<ZohoBookingsResult> {
	const resource = {
		id: resourceId,
		...(name !== undefined ? { name } : {}),
		...(status !== undefined ? { status } : {}),
		...(description !== undefined ? { description } : {}),
		...(workspaceIds !== undefined ? { assigned_workspaces: workspaceIds } : {}),
		...(serviceIds !== undefined ? { assigned_services: serviceIds } : {}),
		...(userInCharge !== undefined ? { user_in_charge: userInCharge } : {}),
	};
	return await postForm({
		auth,
		path: '/updateresource',
		fields: {
			resourceMap: JSON.stringify({ data: resource }),
			...(ignorePastAppointments !== undefined
				? { ignorePastAppointments: String(ignorePastAppointments) }
				: {}),
		},
	});
}

async function deleteResource({
	auth,
	resourceId,
	ignorePastAppointments,
}: {
	auth: ZohoBookingsAuthValue;
	resourceId: string;
	ignorePastAppointments?: boolean;
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/deleteresource',
		fields: {
			resourceMap: JSON.stringify({ id: resourceId }),
			...(ignorePastAppointments !== undefined
				? { ignorePastAppointments: String(ignorePastAppointments) }
				: {}),
		},
	});
}

async function createCustomer({
	auth,
	...customer
}: CustomerFields & { auth: ZohoBookingsAuthValue }): Promise<Record<string, unknown>> {
	const result = await postForm<ZohoBookingsBatchResult>({
		auth,
		path: '/addcustomer',
		fields: { customerMap: JSON.stringify({ data: [customerPayload(customer)] }) },
	});
	return firstBatchItem({ result });
}

async function updateCustomer({
	auth,
	customerId,
	...customer
}: CustomerFields & {
	auth: ZohoBookingsAuthValue;
	customerId: string;
}): Promise<Record<string, unknown>> {
	const result = await postForm<{ message?: Record<string, unknown> | string }>({
		auth,
		path: '/updatecustomer',
		fields: {
			customerMap: JSON.stringify({ data: { id: customerId, ...customerPayload(customer) } }),
		},
	});
	return typeof result.message === 'object' ? result.message : result;
}

async function deleteCustomer({
	auth,
	customerId,
}: {
	auth: ZohoBookingsAuthValue;
	customerId: string;
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/deletecustomer',
		fields: { customerMap: JSON.stringify({ id: customerId }) },
	});
}

async function listDateOverrides({
	auth,
	availabilityFor,
	availabilityForId,
	type,
	fromTime,
	toTime,
	page,
}: ListDateOverridesParams & {
	auth: ZohoBookingsAuthValue;
}): Promise<ZohoBookingsDateOverridesPage> {
	const response = await zohoBookingsClient.request<
		ZohoBookingsResponse<ZohoBookingsDateOverridesPage>
	>({
		auth,
		method: HttpMethod.GET,
		path: '/fetchdateoverrides',
		query: {
			availability_for: availabilityFor,
			...(availabilityForId ? { availability_for_id: availabilityForId } : {}),
			...(type ? { type } : {}),
			...(fromTime ? { from_time: fromTime } : {}),
			...(toTime ? { to_time: toTime } : {}),
			...(page !== undefined ? { page: String(page) } : {}),
		},
	});
	assertSuccess({ response });
	return response.response.returnvalue;
}

async function createDateOverrides({
	auth,
	availabilityFor,
	availabilityForId,
	overrides,
}: {
	auth: ZohoBookingsAuthValue;
	availabilityFor: string;
	availabilityForId?: string;
	overrides: unknown[];
}): Promise<ZohoBookingsResult> {
	const data = {
		availability_for: availabilityFor,
		...(availabilityForId ? { availability_for_id: availabilityForId } : {}),
		overrides,
	};
	return await postForm({
		auth,
		path: '/createdateoverrides',
		fields: { data: JSON.stringify(data) },
	});
}

async function updateDateOverrides({
	auth,
	overrides,
}: {
	auth: ZohoBookingsAuthValue;
	overrides: unknown[];
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/updatedateoverrides',
		fields: { data: JSON.stringify({ overrides }) },
	});
}

async function deleteDateOverrides({
	auth,
	ids,
}: {
	auth: ZohoBookingsAuthValue;
	ids: string[];
}): Promise<ZohoBookingsResult> {
	return await postForm({
		auth,
		path: '/deletedateoverrides',
		fields: { data: JSON.stringify({ ids }) },
	});
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

	const response = await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/availableslots',
		query,
	});
	assertSuccess({ response });
	return response;
}

async function getAppointment({
	auth,
	bookingId,
}: {
	auth: ZohoBookingsAuthValue;
	bookingId: string;
}): Promise<ZohoBookingsResponse> {
	const response = await zohoBookingsClient.request<ZohoBookingsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getappointment',
		query: { booking_id: bookingId },
	});
	assertSuccess({ response });
	return response;
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

async function postForm<T = ZohoBookingsResult>({
	auth,
	path,
	fields,
}: {
	auth: ZohoBookingsAuthValue;
	path: string;
	fields: Record<string, string>;
}): Promise<T> {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.append(key, value);
	}
	const response = await zohoBookingsClient.request<ZohoBookingsResponse<T>>({
		auth,
		method: HttpMethod.POST,
		path,
		headers: FORM_HEADERS,
		body: formData,
	});
	assertSuccess({ response });
	return response.response.returnvalue;
}

async function list<T>({
	auth,
	path,
	query,
}: {
	auth: ZohoBookingsAuthValue;
	path: string;
	query: Record<string, string>;
}): Promise<T[]> {
	const response = await zohoBookingsClient.request<
		ZohoBookingsResponse<{ data?: T[]; status?: string; mesage?: string }>
	>({
		auth,
		method: HttpMethod.GET,
		path,
		headers: JSON_HEADERS,
		query,
	});
	const result = response?.response?.returnvalue;
	if (result?.status === 'failure' && result.mesage?.startsWith('There is no')) {
		return [];
	}
	assertSuccess({ response });
	return response?.response?.returnvalue?.data || [];
}

function assertSuccess({ response }: { response: ZohoBookingsResponse<unknown> }): void {
	const body = response?.response;
	const result: ZohoBookingsStatusResult =
		typeof body?.returnvalue === 'object' && body.returnvalue !== null ? body.returnvalue : {};
	const failed = [response?.status, body?.status, result.status].some(
		(status) => status === 'failure' || status === 'error',
	);
	if (failed) {
		throw new Error(
			String(
				body?.errormessage ??
					body?.message ??
					result.message ??
					result.mesage ??
					result.errorMessage ??
					response?.message ??
					'Zoho Bookings reported a failure',
			),
		);
	}
}

function firstBatchItem({ result }: { result: ZohoBookingsBatchResult }): Record<string, unknown> {
	const item = result.response?.[0];
	if (item?.status !== 'success') {
		throw new Error(String(item?.message ?? JSON.stringify(result)));
	}
	return typeof item.message === 'object' ? item.message : item;
}

function serviceDetails({
	duration,
	cost,
	preBuffer,
	postBuffer,
	description,
	staffIds,
	meetingMode,
	meetingType,
}: ServiceDetails): Record<string, unknown> {
	return {
		...(duration !== undefined ? { duration: String(duration) } : {}),
		...(cost !== undefined ? { cost: String(cost) } : {}),
		...(preBuffer !== undefined ? { pre_buffer: String(preBuffer) } : {}),
		...(postBuffer !== undefined ? { post_buffer: String(postBuffer) } : {}),
		...(description !== undefined ? { description } : {}),
		...(staffIds !== undefined ? { assigned_staffs: staffIds } : {}),
		...(meetingMode !== undefined ? { meeting_mode: meetingMode } : {}),
		...(meetingType !== undefined ? { meeting_type: meetingType } : {}),
	};
}

function customerPayload({
	name,
	firstName,
	lastName,
	email,
	phone,
}: CustomerFields): Record<string, string> {
	return {
		...(name !== undefined ? { name } : {}),
		...(firstName !== undefined ? { first_name: firstName } : {}),
		...(lastName !== undefined ? { last_name: lastName } : {}),
		...(email !== undefined ? { email } : {}),
		...(phone !== undefined ? { contact_number: phone } : {}),
	};
}

function formatDateTime(date: string): string {
	const d = new Date(date);
	const day = d.getUTCDate().toString().padStart(2, '0');
	const month = MONTHS[d.getUTCMonth()];
	const year = d.getUTCFullYear();
	const hours = d.getUTCHours().toString().padStart(2, '0');
	const minutes = d.getUTCMinutes().toString().padStart(2, '0');
	const seconds = d.getUTCSeconds().toString().padStart(2, '0');
	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function formatDate(date: string): string {
	const d = new Date(date);
	const year = d.getUTCFullYear();
	const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
	const day = d.getUTCDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export const zohoBookingsApi = {
	listWorkspaces,
	listServices,
	listResources,
	listStaff,
	listAppointments,
	searchAppointments,
	updateAppointment,
	createWorkspace,
	updateWorkspace,
	deleteWorkspace,
	createService,
	updateService,
	deleteService,
	addStaff,
	createResource,
	updateResource,
	deleteResource,
	createCustomer,
	updateCustomer,
	deleteCustomer,
	listDateOverrides,
	createDateOverrides,
	updateDateOverrides,
	deleteDateOverrides,
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

type SearchAppointmentsParams = {
	serviceId?: string;
	staffId?: string;
	resourceId?: string;
	fromTime?: string;
	toTime?: string;
	status?: string;
	page?: number;
	perPage?: number;
	includeCustomFields?: boolean;
	customerName?: string;
	customerEmail?: string;
	customerPhone?: string;
	createdFrom?: string;
	createdTill?: string;
};

type ServiceDetails = {
	duration?: number;
	cost?: number;
	preBuffer?: number;
	postBuffer?: number;
	description?: string;
	staffIds?: unknown[];
	meetingMode?: string;
	meetingType?: string;
};

type CreateServiceParams = ServiceDetails & {
	workspaceId: string;
	name: string;
	serviceType?: string;
	resourceIds?: unknown[];
};

type UpdateServiceParams = ServiceDetails & {
	serviceId: string;
	name?: string;
	status?: string;
};

type AddStaffParams = {
	name: string;
	email: string;
	role?: string;
	gender?: string;
	dob?: string;
	phone?: string;
	designation?: string;
	additionalInfo?: string;
	serviceIds?: unknown[];
};

type UpdateResourceParams = {
	resourceId: string;
	name?: string;
	status?: string;
	description?: string;
	workspaceIds?: unknown[];
	serviceIds?: unknown[];
	userInCharge?: string;
	ignorePastAppointments?: boolean;
};

type CustomerFields = {
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
};

type ListDateOverridesParams = {
	availabilityFor: string;
	availabilityForId?: string;
	type?: string;
	fromTime?: string;
	toTime?: string;
	page?: number;
};
