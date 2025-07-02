import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL, getAppointmentDetails } from '../common';
import { appointmentTypeIdDropdown, calendarIdDropdown } from '../common/props';

const TRIGGER_KEY = 'trigger_appointment_canceled';

export const appointmentCanceledTrigger = createTrigger({
	auth: acuitySchedulingAuth,
	name: 'appointment_canceled',
	displayName: 'Appointment Canceled',
	description: 'Triggers when an appointment is canceled.',
	props: {
		calendarId: calendarIdDropdown({
			displayName: 'Calendar',
			required: false,
		}),
		appointmentTypeId: appointmentTypeIdDropdown({
			displayName: 'Appointment Type',
			required: false,
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: `${API_URL}/webhooks`,
			body: {
				target: context.webhookUrl,
				event: 'appointment.canceled',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		};
		const response = await httpClient.sendRequest<{ id: string }>(request);
		await context.store.put<string>(TRIGGER_KEY, response.body.id);
	},
	async onDisable(context) {
		const webhookId = await context.store.get<string>(TRIGGER_KEY);
		if (webhookId) {
			const request: HttpRequest = {
				method: HttpMethod.DELETE,
				url: `${API_URL}/webhooks/${webhookId}`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth.access_token,
				},
			};
			await httpClient.sendRequest(request);
			await context.store.delete(TRIGGER_KEY);
		}
	},
	async test(context) {
		const { calendarId, appointmentTypeId } = context.propsValue;

		const qs: QueryParams = {
			max: '10',
			canceled: 'true',
		};

		if (calendarId) qs['calendarID'] = calendarId.toString();
		if (appointmentTypeId) qs['appointmentTypeID'] = appointmentTypeId.toString();

		const response = await httpClient.sendRequest<Array<Record<string, any>>>({
			method: HttpMethod.GET,
			url: `${API_URL}/appointments`,
			queryParams: qs,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
	async run(context) {
		const { calendarId, appointmentTypeId } = context.propsValue;

		const payload = context.payload.body as {
			action: string;
			id: number;
			calendarID: number;
			appointmentTypeID: number;
		};

		// Check for 'canceled' action
		if (
			payload.action === 'appointment.canceled' &&
			payload.id &&
			(!calendarId || calendarId === payload.calendarID) &&
			(!appointmentTypeId || appointmentTypeId === payload.appointmentTypeID)
		) {
			try {
				const appointmentDetails = await getAppointmentDetails(
					payload.id.toString(),
					context.auth.access_token,
				);
				return [appointmentDetails];
			} catch (error) {
				console.error(`Failed to fetch appointment details for ID ${payload.id}:`, error);
				return [];
			}
		} else {
			console.log('Received webhook for non-canceled event or missing ID:', payload.action);
			return [];
		}
	},
	sampleData: {
		id: 67890,
		firstName: 'Jane',
		lastName: 'Smith',
		email: 'jane.smith@example.com',
		phone: '555-5678',
		date: '2023-12-05',
		time: '02:00 PM',
		datetime: '2023-12-05T14:00:00-0500',
		endTime: '03:00 PM',
		datetimeCreated: '2023-11-30T10:15:00-0500',
		appointmentTypeID: 102,
		calendarID: 2,
		notes: 'Follow-up meeting.',
		price: '75.00',
		paid: 'no',
		status: 'canceled',
		noShow: false,
	},
});
