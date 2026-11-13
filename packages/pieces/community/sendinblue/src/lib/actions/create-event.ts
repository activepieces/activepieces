import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const createEvent = createAction({
	auth: sendinblueAuth,
	name: 'create_event',
	classification: 'WRITE',
	displayName: 'Create Event',
	description: 'Track a custom event for a contact.',
	audience: 'both',
	aiMetadata: {
		description:
			'Records a custom event against a Brevo contact so automations and segments can react to it. Identify the contact by email, contact id or external id, and attach arbitrary event properties. Brevo answers with an empty body, so this returns a success flag rather than the stored event. Not idempotent — each call records another occurrence.',
		idempotent: false,
	},
	propertyGroups: [
		{
			key: 'event',
			display: 'section',
			label: 'Event',
			icon: 'calendar',
			props: ['event_name', 'event_date', 'event_properties'],
		},
		{
			key: 'contact',
			display: 'section',
			label: 'Contact',
			icon: 'user',
			props: ['email', 'contact_properties'],
		},
	],
	props: {
		event_name: Property.ShortText({
			displayName: 'Name',
			description: 'How the event is named in Brevo.',
			placeholder: 'order_completed',
			required: true,
		}),
		event_date: Property.DateTime({
			displayName: 'Date',
			description: 'Leave empty to use the current time.',
			required: false,
		}),
		event_properties: Property.Object({
			displayName: 'Details',
			description: 'Event data, such as an order ID and total.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'The contact the event belongs to.',
			placeholder: 'jane@example.com',
			required: true,
		}),
		contact_properties: Property.Object({
			displayName: 'Attributes',
			description: 'Contact attributes to update, such as FIRSTNAME.',
			required: false,
		}),
	},
	async run(context) {
		const { event_name, email, event_date, event_properties, contact_properties } =
			context.propsValue;

		const body = {
			event_name,
			identifiers: { email_id: email },
			event_date: event_date ?? undefined,
			event_properties: brevoCommon.isEmptyObject(event_properties) ? undefined : event_properties,
			contact_properties: brevoCommon.isEmptyObject(contact_properties)
				? undefined
				: contact_properties,
		};

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/events',
			body,
		});

		return { success: true };
	},
});
