import { createAction, Property } from '@activepieces/pieces-framework';
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
	description: 'Updates the name, phone, email, gender or opt-ins of a subscriber. Empty fields are left unchanged.',
	audience: 'both',
	aiMetadata: {
		description:
			'Updates the system fields of an existing ManyChat subscriber by subscriber ID: first and last name, phone, email, gender and SMS/email opt-in. Only the fields you give are sent. Phone needs SMS Opt-in, email needs Email Opt-in (No stores the address without opting in; an address cannot be removed), and SMS Opt-in yes needs a Consent Phrase. For custom fields use "Set Subscriber Custom Fields"; for tags use "Add Tag to User". Repeating the same update leaves the same state.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.subscriber,
	props: {
		subscriber_id: manychatProps.subscriberIdText(),
		first_name: Property.ShortText({ displayName: 'First Name', required: false }),
		last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			description: 'International format, for example +14155550123. Requires SMS Opt-in.',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Requires Email Opt-in. Choosing No stores the address without opting in. An address cannot be removed through the API.',
			required: false,
		}),
		gender: Property.ShortText({ displayName: 'Gender', required: false }),
		has_opt_in_sms: aiProps.yesNo({
			displayName: 'SMS Opt-in',
			description: 'Whether the subscriber agreed to receive SMS. Required when Phone is set. Leave empty to keep the current value.',
		}),
		has_opt_in_email: aiProps.yesNo({
			displayName: 'Email Opt-in',
			description: 'Whether the subscriber agreed to receive email. Required when Email is set. Leave empty to keep the current value.',
		}),
		consent_phrase: Property.ShortText({
			displayName: 'Consent Phrase',
			description: 'The consent phrase the subscriber accepted. Required when SMS Opt-in is Yes.',
			required: false,
		}),
	},
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
