import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listContactAttributesActionOutputSchema } from '../output-schemas';

export const listContactAttributes = createAction({
	auth: sendinblueAuth,
	name: 'list_contact_attributes',
	outputSchema: listContactAttributesActionOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Contact Attributes',
	description: 'List all contact attributes configured in the Brevo account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every contact attribute configured in the Brevo account, with its category and type. Use this before calling create_or_update_contact or update_contact to discover valid attribute names, since Brevo rejects attributes that do not already exist. Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/contacts/attributes',
		});
	},
});
