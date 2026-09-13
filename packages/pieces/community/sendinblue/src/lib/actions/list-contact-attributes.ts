import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { listContactAttributesActionOutputSchema } from '../output-schemas';

export const listContactAttributes = createAction({
	auth: sendinblueAuth,
	name: 'list_contact_attributes',
	outputSchema: listContactAttributesActionOutputSchema,
	classification: 'READ',
	displayName: 'List Contact Attributes',
	description: 'List the contact attributes configured on the account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every contact attribute defined on the Brevo account, with its name, category and data type. Call this before Create Contact or Update Contact when you intend to set attributes: Brevo rejects any attribute name that is not already configured, so this is how you learn the valid keys and their types. Takes no input. Read-only and idempotent.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const response = await brevoCommon.apiCall<AttributesResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/contacts/attributes',
		});

		const attributes = response.attributes ?? [];

		return { attributes, count: attributes.length };
	},
});

type AttributesResponse = {
	attributes?: unknown[];
};
