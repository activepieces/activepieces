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

const TRIGGER_KEY = 'trigger_new_appointment';

export const appointmentScheduledTrigger = createTrigger({
	auth: acuitySchedulingAuth,
	name: 'new_appointment',
	displayName: 'New Appointment',
	description: 'Triggers when a new appointment is scheduled.',
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
				event: 'appointment.scheduled',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		};
		const response = await httpClient.sendRequest<{ id: string }>(request);
		await context.store.put(TRIGGER_KEY, response.body.id);
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
		if (
			payload.action === 'appointment.scheduled' &&
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
			console.log('Received webhook for non-scheduled event or missing ID:', payload.action);
			return [];
		}
	},
	sampleData: {
		id: 12345,
		firstName: 'John',
		lastName: 'Doe',
		email: 'john.doe@example.com',
		phone: '555-1234',
		date: '2023-12-01',
		time: '10:00 AM',
		datetime: '2023-12-01T10:00:00-0500',
		endTime: '11:00 AM',
		datetimeCreated: '2023-11-28T14:30:00-0500',
		appointmentTypeID: 101,
		calendarID: 1,
		notes: 'First appointment.',
		price: '50.00',
		paid: 'yes',
		status: 'scheduled',
	},
});
