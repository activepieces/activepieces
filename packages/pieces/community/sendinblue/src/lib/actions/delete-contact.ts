import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { deleteContactActionOutputSchema } from '../output-schemas';

export const deleteContact = createAction({
	auth: sendinblueAuth,
	name: 'delete_contact',
	outputSchema: deleteContactActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Delete Contact',
	description: 'Permanently delete a contact and its history.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a Brevo contact along with its statistics and list memberships. This cannot be undone — to stop mailing someone while keeping their record, use Update Contact with Blacklist From Email set to Yes instead. Identify the contact by email, phone, contact id or external id, setting Identifier Type for the last one. Not idempotent: deleting an already deleted contact fails with a not-found error.',
		idempotent: false,
	},
	props: {
		identifier: brevoProps.contactIdentifier,
		identifier_type: brevoProps.contactIdentifierType,
	},
	async run(context) {
		const { identifier, identifier_type } = context.propsValue;

		await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/contacts/${encodeURIComponent(identifier)}`,
			query: { identifierType: identifier_type },
		});

		return { success: true, identifier };
	},
});
