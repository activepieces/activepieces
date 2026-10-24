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

export type ZohoBookingsListResponse<T> = {
	response?: { returnvalue?: { data?: T[] } };
};

export type ZohoBookingsAppointmentsResponse = {
	response?: {
		returnvalue?: { response?: ZohoBookingsAppointment[] | Record<string, unknown> };
	};
};

export type ZohoBookingsResponse<T = Record<string, unknown>> = {
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
