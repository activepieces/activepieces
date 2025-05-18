import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { manychatAuth } from '../../index';
import { BASE_URL } from '../common/props';
import { isNil } from '@activepieces/shared';

export const createSubscriberAction = createAction({
	auth: manychatAuth,
	name: 'createSubscriber',
	displayName: 'Create Subscriber',
	description: 'Creates a Unified or a Whatsapp subscriber.',
	props: {
		first_name: Property.ShortText({
			displayName: 'First Name',
			required: true,
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			description: 'Fill in at least one field: phone or email or whatsapp phone.',
		}),
		whatsapp_phone: Property.ShortText({
			displayName: 'WhatsApp Phone',
			required: false,
			description: 'Fill in at least one field: phone or email or whatsapp phone.',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
			description: 'Fill in at least one field: phone or email or whatsapp phone.',
		}),
		gender: Property.ShortText({
			displayName: 'Gender',
			required: false,
		}),
		has_opt_in_sms: Property.Checkbox({
			displayName: 'SMS Opt-in',
			required: false,
		}),
		has_opt_in_email: Property.Checkbox({
			displayName: 'Email Opt-in',
			required: false,
		}),
		consent_phrase: Property.ShortText({
			displayName: 'Consent Phrase',
			description: 'The consent phrase provided by the subscriber.',
			required: false,
		}),
	},
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
		if (isNil(phone) && isNil(whatsapp_phone) && isNil(email)) {
			throw Error(
				'To create a subscriber you must fill in at least one field: phone or email or whatsapp_phone.',
			);
		}
		const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
			method: HttpMethod.POST,
			url: `${BASE_URL}/subscriber/createSubscriber`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			body: {
				first_name,
				last_name,
				phone,
				whatsapp_phone,
				email,
				gender,
				has_opt_in_sms,
				has_opt_in_email,
				consent_phrase,
			},
		});

		return response.body;
	},
});
