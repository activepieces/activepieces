import type { AppConnectionType } from '@activepieces/pieces-framework';

export type ZohoBookingsAuthValue = {
	type: AppConnectionType.OAUTH2;
	access_token: string;
	props?: { location?: string };
};

export type ZohoBookingsWorkspace = { id: string; name: string };
export type ZohoBookingsService = { id: string; name: string; duration?: string };
export type ZohoBookingsStaff = { id: string; name: string; designation?: string };
export type ZohoBookingsResource = { id: string; name: string };
export type ZohoBookingsAppointment = {
	booking_id: string;
	customer_name?: string;
	service_name?: string;
	start_time?: string;
	status?: string;
};

export type ZohoBookingsAppointmentsPage = {
	response?: ZohoBookingsAppointment[] | Record<string, unknown>;
	next_page_available?: boolean;
	page?: number;
};

export type ZohoBookingsResponse<T = ZohoBookingsResult> = {
	status?: string;
	message?: string;
	response: {
		status: string;
		message?: string;
		errormessage?: string;
		returnvalue: T;
	};
};

export type ZohoBookingsRescheduleResult = {
	Status?: string;
	message?: string;
};

export type ZohoBookingsResult = Record<string, unknown>;

export type ZohoBookingsStatusResult = {
	status?: unknown;
	message?: unknown;
	mesage?: unknown;
	errorMessage?: unknown;
};

export type ZohoBookingsBatchResult = {
	response?: {
		status?: string;
		message?: Record<string, unknown> | string;
		[key: string]: unknown;
	}[];
};

export type ZohoBookingsDateOverridesPage = {
	availability_for?: string;
	availability_for_id?: string;
	overrides?: Record<string, unknown>[] | string;
	next_page_available?: boolean;
};
