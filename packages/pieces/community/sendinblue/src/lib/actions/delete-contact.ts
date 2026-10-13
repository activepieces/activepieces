import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const deleteContact = createAction({
	auth: sendinblueAuth,
	name: 'delete_contact',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Contact',
	description: 'Permanently delete a contact from Brevo.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Brevo contact identified by email, phone number, contact id, external id, WhatsApp id or landline number. This removes the contact record entirely and cannot be undone; prefer unsubscribe_contact when the intent is only to stop sending, not to erase the record. Not idempotent — retrying after a successful delete returns a 404 for the now-missing contact.',
		idempotent: false,
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

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}`,
			query: { identifierType: identifier_type },
		});

		return { success: true };
	},
});
