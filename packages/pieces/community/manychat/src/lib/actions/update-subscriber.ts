import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatData, manychatInput, manychatProps } from '../common/props';
import { aiInput, aiProps } from '../common/ai-props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const updateSubscriberAction = createAction({
	auth: manychatAuth,
	name: 'update_subscriber',
	classification: 'WRITE',
	displayName: 'Update Subscriber',
	description: `Updates a subscriber's name, phone, email, gender or opt-ins.`,
	audience: 'both',
	aiMetadata: {
		description:
			'Updates the system fields of an existing ManyChat subscriber by subscriber ID: first and last name, phone, email, gender and SMS/email opt-in. Only the fields you give are sent. Phone needs SMS Opt-in, email needs Email Opt-in (No stores the address without opting in; an address cannot be removed), and SMS Opt-in yes needs a Consent Phrase. For custom fields use "Set Subscriber Custom Fields"; for tags use "Add Tag to Subscriber". Repeating the same update leaves the same state.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.subscriber,
	props: {
		subscriber_id: manychatProps.subscriberIdText(),
		changes_info: Property.MarkDown({
			value: 'Fields left empty below keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		first_name: Property.ShortText({ displayName: 'First Name', required: false, width: 'half' }),
		last_name: Property.ShortText({ displayName: 'Last Name', required: false, width: 'half' }),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			description: 'Needs SMS Opt-in.',
			placeholder: '+14155550123',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: `Needs Email Opt-in. An address can't be removed once saved.`,
			placeholder: 'jane@example.com',
			required: false,
		}),
		gender: Property.ShortText({ displayName: 'Gender', required: false }),
		has_opt_in_sms: aiProps.yesNo({
			displayName: 'SMS Opt-in',
			description: 'Required when Phone Number is set.',
		}),
		has_opt_in_email: aiProps.yesNo({
			displayName: 'Email Opt-in',
			description: 'Required when Email is set. No saves the email without opting in.',
		}),
		consent_phrase: Property.ShortText({
			displayName: 'Consent Phrase',
			description: 'Required when SMS Opt-in is Yes.',
			required: false,
		}),
	},
	propertyGroups: [
		{ key: 'subscriber', display: 'section', label: 'Subscriber to Update', icon: 'user', props: ['subscriber_id', 'changes_info'] },
		{ key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['first_name', 'last_name', 'phone', 'email', 'gender'] },
		{ key: 'opt_ins', display: 'section', label: 'Opt-ins', icon: 'inbox', props: ['has_opt_in_sms', 'has_opt_in_email', 'consent_phrase'] },
	],
	async run({ auth, propsValue }) {
		const apiKey = manychatUtils.apiKeyOf(auth);
		const id = manychatInput.subscriberIdText({ value: propsValue.subscriber_id });
		const phone = manychatInput.optionalText(propsValue.phone);
		const email = manychatInput.optionalText(propsValue.email);
		const consentPhrase = manychatInput.optionalText(propsValue.consent_phrase);
		const smsOptIn = aiInput.yesNo({ value: propsValue.has_opt_in_sms, label: 'SMS Opt-in' });
		const emailOptIn = aiInput.yesNo({ value: propsValue.has_opt_in_email, label: 'Email Opt-in' });
		manychatInput.checkContactRules({ phone, email, smsOptIn, emailOptIn, consentPhrase });
		const changes = {
			first_name: manychatInput.optionalText(propsValue.first_name),
			last_name: manychatInput.optionalText(propsValue.last_name),
			phone,
			email,
			gender: manychatInput.optionalText(propsValue.gender),
			has_opt_in_sms: smsOptIn,
			has_opt_in_email: emailOptIn,
			consent_phrase: consentPhrase,
		};
		if (Object.values(changes).every((value) => value === undefined)) {
			throw new Error('Provide at least one field to update.');
		}
		const body = await manychatClient.request({
			apiKey,
			method: 'POST',
			path: '/subscriber/updateSubscriber',
			operation: 'update subscriber',
			body: { subscriber_id: manychatInput.apiId(id), ...changes },
		});
		const data = manychatUtils.dataOf(body);
		return manychatUtils.isRecord(data) && data['id'] !== undefined ? data : manychatData.getSubscriber({ apiKey, subscriberId: id });
	},
});
