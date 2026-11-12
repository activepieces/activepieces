import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { findContactActionOutputSchema } from '../output-schemas';

export const findContact = createAction({
	auth: sendinblueAuth,
	name: 'find_contact',
	outputSchema: findContactActionOutputSchema,
	classification: 'READ',
	displayName: 'Find Contact',
	description: 'Check whether a contact exists in Brevo and fetch its details.',
	audience: 'both',
	aiMetadata: {
		description:
			'Looks up a single Brevo contact by email, phone number, contact id, external id, WhatsApp id or landline number, and returns its attributes, list membership and blacklist flags. Returns found:false instead of failing when no contact matches, so it is safe to branch on. Read-only and idempotent.',
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'lookup',
			display: 'section',
			label: 'Contact',
			icon: 'user',
			props: ['identifier_type', 'identifier'],
		},
	],
	props: {
		identifier_type: Property.StaticDropdown({
			displayName: 'Look Up By',
			description: 'What kind of value you are searching with.',
			required: false,
			defaultValue: 'email_id',
			width: 'half',
			options: {
				options: [
					{ label: 'Email', value: 'email_id' },
					{ label: 'Mobile Number', value: 'phone_id' },
					{ label: 'Contact ID', value: 'contact_id' },
					{ label: 'External ID', value: 'ext_id' },
					{ label: 'WhatsApp', value: 'whatsapp_id' },
					{ label: 'Landline Number', value: 'landline_number_id' },
				],
			},
		}),
		identifier: Property.ShortText({
			displayName: 'Value',
			description: 'The email, number or ID to search for.',
			placeholder: 'jane@example.com',
			required: true,
			width: 'half',
		}),
	},
	async run(context) {
		const { identifier, identifier_type } = context.propsValue;

		try {
			const contact = await brevoCommon.apiCall({
				apiKey: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/contacts/${encodeURIComponent(identifier)}`,
				query: { identifierType: identifier_type },
			});

			return { found: true, data: contact };
		} catch (error) {
			if (error instanceof HttpError && error.response.status === 404) {
				return { found: false, data: {} };
			}
			throw error;
		}
	},
});
