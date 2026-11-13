import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderCreateCustomEventAction = createAction({
	auth: senderAuth,
	name: 'sender_create_custom_event',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Create Custom Event',
	description: 'Records a custom event for a subscriber.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a custom event (e.g. "product_viewed", "order_placed") against a subscriber, identified by at least one of email, phone or subscriber ID, with an optional value and properties. Events can start automation workflows. Each call records a new event.',
		idempotent: false,
	},
	props: {
		subscriberEmail: Property.ShortText({ displayName: 'Subscriber Email', required: false }),
		subscriberPhone: Property.ShortText({
			displayName: 'Subscriber Phone',
			description: 'Phone number with country code.',
			required: false,
		}),
		subscriberId: Property.ShortText({
			displayName: 'Subscriber ID',
			description: 'Sender subscriber ID, from Get Subscriber.',
			required: false,
		}),
		type: Property.ShortText({
			displayName: 'Event Type',
			description: 'Event name, e.g. "product_viewed".',
			required: true,
		}),
		value: Property.Number({
			displayName: 'Value',
			description: 'Optional numeric value, e.g. an order total.',
			required: false,
		}),
		valueCurrency: Property.ShortText({
			displayName: 'Currency',
			description: 'ISO 4217 code for Value, e.g. "USD".',
			required: false,
		}),
		properties: Property.Json({
			displayName: 'Properties',
			description:
				'Flat object of extra event properties (strings, numbers, dates or booleans; 8KB total).',
			required: false,
		}),
	},
	async run(context) {
		const {
			subscriberEmail,
			subscriberPhone,
			subscriberId,
			type,
			value,
			valueCurrency,
			properties,
		} = context.propsValue;
		if (!subscriberEmail && !subscriberPhone && !subscriberId) {
			throw new Error('Set at least one of Subscriber Email, Subscriber Phone or Subscriber ID.');
		}
		return await senderApi.createCustomEvent({
			auth: context.auth,
			subscriber: { id: subscriberId, email: subscriberEmail, phone: subscriberPhone },
			type,
			value,
			valueCurrency,
			properties,
		});
	},
});
