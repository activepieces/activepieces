import { createAction, Property } from '@activepieces/pieces-framework';
import { whatsappAuth } from '../auth';
import { commonProps } from '../common/utils';
import { whatsappProps } from '../common/props';
import { whatsappClient } from '../common/client';
import { inputUtils } from '../common/inputs';
import { messageSendOutputSchema } from '../output-schemas';

export const sendContact = createAction({
	auth: whatsappAuth,
	name: 'send_contact',
	outputSchema: messageSendOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Contact',
	description: 'Sends a contact card the recipient can save.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a WhatsApp contact card with a name and optional phone numbers, emails, company and website that the recipient can save to their address book. Choose this over Send Message when sharing a person or business as a savable contact. Free-form, so it only delivers inside the 24-hour customer service window. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		phone_number_id: commonProps.phone_number_id,
		to: whatsappProps.to,
		formatted_name: Property.ShortText({
			displayName: 'Full Name',
			description: 'Display name shown on the card.',
			required: true,
		}),
		first_name: Property.ShortText({ displayName: 'First Name', required: false }),
		last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
		phones: Property.Array({
			displayName: 'Phone Numbers',
			description: 'One entry per number the recipient can call or message.',
			required: false,
			properties: {
				phone: Property.ShortText({
					displayName: 'Phone',
					description: 'Include the country code, for example +962791234567.',
					required: true,
				}),
				type: Property.StaticDropdown({
					displayName: 'Type',
					description: 'Label shown next to the number.',
					required: false,
					options: {
						options: [
							{ label: 'Cell', value: 'CELL' },
							{ label: 'Main', value: 'MAIN' },
							{ label: 'Work', value: 'WORK' },
							{ label: 'Home', value: 'HOME' },
							{ label: 'iPhone', value: 'IPHONE' },
						],
					},
				}),
			},
		}),
		emails: Property.Array({
			displayName: 'Emails',
			description: 'One entry per email address.',
			required: false,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				type: Property.StaticDropdown({
					displayName: 'Type',
					description: 'Label shown next to the address.',
					required: false,
					options: {
						options: [
							{ label: 'Work', value: 'WORK' },
							{ label: 'Home', value: 'HOME' },
						],
					},
				}),
			},
		}),
		company: Property.ShortText({ displayName: 'Company', required: false }),
		job_title: Property.ShortText({ displayName: 'Job Title', required: false }),
		website: Property.ShortText({ displayName: 'Website', required: false }),
		reply_to_message_id: whatsappProps.replyToMessageId,
	},
	async run(context) {
		const {
			phone_number_id,
			to,
			formatted_name,
			first_name,
			last_name,
			phones,
			emails,
			company,
			job_title,
			website,
			reply_to_message_id,
		} = context.propsValue;
		const phoneEntries = inputUtils.asRecords(phones).map((entry) => ({
			phone: inputUtils.requiredString({ record: entry, key: 'phone', label: 'Phone' }),
			type: inputUtils.optionalString({ record: entry, key: 'type' }),
		}));
		const emailEntries = inputUtils.asRecords(emails).map((entry) => ({
			email: inputUtils.requiredString({ record: entry, key: 'email', label: 'Email' }),
			type: inputUtils.optionalString({ record: entry, key: 'type' }),
		}));
		const org = company || job_title ? { ...(company ? { company } : {}), ...(job_title ? { title: job_title } : {}) } : undefined;
		return whatsappClient.sendMessage({
			accessToken: context.auth.props.access_token,
			phoneNumberId: phone_number_id,
			to,
			replyToMessageId: reply_to_message_id,
			payload: {
				type: 'contacts',
				contacts: [
					{
						name: {
							formatted_name,
							...(first_name ? { first_name } : {}),
							...(last_name ? { last_name } : {}),
						},
						...(phoneEntries.length > 0
							? { phones: phoneEntries.map((entry) => ({ phone: entry.phone, ...(entry.type ? { type: entry.type } : {}) })) }
							: {}),
						...(emailEntries.length > 0
							? { emails: emailEntries.map((entry) => ({ email: entry.email, ...(entry.type ? { type: entry.type } : {}) })) }
							: {}),
						...(org ? { org } : {}),
						...(website ? { urls: [{ url: website, type: 'WORK' }] } : {}),
					},
				],
			},
		});
	},
});
