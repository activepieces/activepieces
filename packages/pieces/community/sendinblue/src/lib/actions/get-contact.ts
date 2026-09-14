import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { getContactActionOutputSchema } from '../output-schemas';

export const getContact = createAction({
	auth: sendinblueAuth,
	name: 'get_contact',
	outputSchema: getContactActionOutputSchema,
	classification: 'READ',
	displayName: 'Get Contact',
	description: 'Fetch one contact by email, phone, contact id or external id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a single Brevo contact and returns its attributes, list membership and blacklist flags. Identify it by email address, phone number, contact id, external id, WhatsApp id or landline number — set Identifier Type for the last three, which cannot be resolved from the value alone. Returns found:false rather than failing when nothing matches, so it is safe to branch on without error handling. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		identifier: brevoProps.contactIdentifier,
		identifier_type: brevoProps.contactIdentifierType,
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
