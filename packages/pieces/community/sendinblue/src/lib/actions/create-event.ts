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
	props: {
		event_name: Property.ShortText({
			displayName: 'Event Name',
			description: 'How the event is identified in Brevo, for example order_completed.',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Contact Email',
			description: 'Email of the contact the event belongs to.',
			required: true,
		}),
		event_date: Property.DateTime({
			displayName: 'Event Date',
			description: 'When the event occurred. Defaults to now when left empty.',
			required: false,
		}),
		event_properties: Property.Object({
			displayName: 'Event Properties',
			description: 'Details of the event, for example {"order_id": 42, "total": 99.5}.',
			required: false,
		}),
		contact_properties: Property.Object({
			displayName: 'Contact Properties',
			description:
				'Contact attributes to update alongside the event, for example {"FIRSTNAME": "Elly"}.',
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

