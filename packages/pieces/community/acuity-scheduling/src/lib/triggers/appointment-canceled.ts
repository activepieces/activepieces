import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL, getAppointmentDetails, AcuityAuthProps } from '../common';
import crypto from 'crypto';

export const appointmentCanceled = createTrigger({
    auth: acuitySchedulingAuth,
    name: 'appointment_canceled',
    displayName: 'Appointment Canceled',
    description: 'Triggers when an appointment is canceled.',
    props: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${API_URL}/webhooks`,
            body: {
                target: context.webhookUrl,
                event: 'appointment.canceled',
            },
            headers: {
                Authorization: 'Basic ' + Buffer.from(`${context.auth.username}:${context.auth.password}`).toString('base64'),
                'Content-Type': 'application/json',
            },
        };
        const response = await httpClient.sendRequest<{ id: string }>(request);
        await context.store.put('_webhook_canceled_id', response.body.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('_webhook_canceled_id');
        if (webhookId) {
            const request: HttpRequest = {
                method: HttpMethod.DELETE,
                url: `${API_URL}/webhooks/${webhookId}`,
                headers: {
                    Authorization: 'Basic ' + Buffer.from(`${context.auth.username}:${context.auth.password}`).toString('base64'),
                },
            };
            await httpClient.sendRequest(request);
            await context.store.delete('_webhook_canceled_id');
        }
    },
    async run(context) {
        const rawBody = context.payload.body as string;
        const signature = context.payload.headers['x-acuity-signature'] as string;
        const apiKey = context.auth.password;

        if (typeof rawBody !== 'string') {
            console.warn('Webhook payload body is not a string for Acuity event.');
            return [];
        }
        const hasher = crypto.createHmac('sha256', apiKey);
        hasher.update(rawBody);
        const computedSignature = hasher.digest('base64');

        if (computedSignature !== signature) {
            console.error('Webhook signature mismatch.');
            return [];
        }

        const params = new URLSearchParams(rawBody);
        const action = params.get('action');
        const appointmentId = params.get('id');

        // Check for 'canceled' action
        if (action === 'canceled' && appointmentId) {
            try {
                const appointmentDetails = await getAppointmentDetails(appointmentId, context.auth as AcuityAuthProps);
                return [appointmentDetails];
            } catch (error) {
                console.error(`Failed to fetch appointment details for ID ${appointmentId}:`, error);
                return [];
            }
        } else {
            console.log('Received webhook for non-canceled event or missing ID:', action);
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
    }
});
