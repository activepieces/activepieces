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
	props: {
		identifier: Property.ShortText({
			displayName: 'Identifier',
			description: 'The value to look the contact up by, for example an email address.',
			required: true,
		}),
		identifier_type: Property.StaticDropdown({
			displayName: 'Identifier Type',
			description: 'How the identifier above should be interpreted.',
			required: false,
			defaultValue: 'email_id',
			options: {
				options: [
					{ label: 'Email', value: 'email_id' },
					{ label: 'Phone (SMS)', value: 'phone_id' },
					{ label: 'Contact ID', value: 'contact_id' },
					{ label: 'External ID', value: 'ext_id' },
					{ label: 'WhatsApp', value: 'whatsapp_id' },
					{ label: 'Landline Number', value: 'landline_number_id' },
				],
			},
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
