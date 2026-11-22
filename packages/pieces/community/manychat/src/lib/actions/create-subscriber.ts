import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const createSubscriberAction = createAction({
	auth: manychatAuth,
	name: 'createSubscriber',
	classification: 'WRITE',
	displayName: 'Create Subscriber',
	description: 'Creates a subscriber from a phone number, WhatsApp number or email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new Manychat subscriber from contact details such as name, email, phone, or WhatsApp phone. Use when onboarding a new contact into Manychat. At least one of phone, email, or WhatsApp phone must be provided. ManyChat decides the opt-in and consent rules; its error is shown as is. Not idempotent: each call creates another subscriber.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.createSubscriber,
	props: {
		first_name: Property.ShortText({
			displayName: 'First Name',
			required: true,
			width: 'half',
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			required: false,
			width: 'half',
		}),
		contact_info: Property.MarkDown({
			value: 'Fill in at least one: Phone Number, WhatsApp Phone or Email.',
			variant: MarkdownVariant.INFO,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			placeholder: '+14155550123',
			width: 'half',
		}),
		whatsapp_phone: Property.ShortText({
			displayName: 'WhatsApp Phone',
			required: false,
			placeholder: '+14155550123',
			width: 'half',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
			placeholder: 'jane@example.com',
		}),
		gender: Property.ShortText({
			displayName: 'Gender',
			required: false,
		}),
		has_opt_in_sms: Property.Checkbox({
			displayName: 'SMS Opt-in',
			description: 'The subscriber agreed to receive SMS.',
			required: false,
		}),
		has_opt_in_email: Property.Checkbox({
			displayName: 'Email Opt-in',
			description: 'The subscriber agreed to receive email.',
			required: false,
		}),
		consent_phrase: Property.ShortText({
			displayName: 'Consent Phrase',
			description: 'The consent text the subscriber accepted. Needed when SMS Opt-in is on.',
			required: false,
		}),
	},
	propertyGroups: [
		{ key: 'name', display: 'section', label: 'Profile', icon: 'user', props: ['first_name', 'last_name', 'gender'] },
		{ key: 'contact', display: 'section', label: 'Contact Details', icon: 'inbox', props: ['contact_info', 'phone', 'whatsapp_phone', 'email'] },
		{ key: 'consent', display: 'section', label: 'Consent', icon: 'sliders', props: ['has_opt_in_sms', 'has_opt_in_email', 'consent_phrase'] },
	],
	async run({ auth, propsValue }) {
		const {
			first_name,
			last_name,
			phone,
			whatsapp_phone,
			email,
			gender,
			has_opt_in_email,
			has_opt_in_sms,
			consent_phrase,
		} = propsValue;
		const hasContact = [phone, whatsapp_phone, email].some((value) => manychatInput.optionalText(value) !== undefined);
		if (!hasContact) {
			throw new Error('Fill in at least one of Phone Number, WhatsApp Phone or Email.');
		}
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'POST',
			path: '/subscriber/createSubscriber',
			operation: 'create subscriber',
			body: {
				first_name,
				last_name,
				phone,
				whatsapp_phone,
				email,
				gender,
				has_opt_in_sms,
				has_opt_in_email,
				consent_phrase: manychatInput.optionalText(consent_phrase),
			},
		});
		return manychatUtils.recordOf(body);
	},
});
