import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';

export const getContactList = createAction({
	auth: sendinblueAuth,
	name: 'get_contact_list',
	classification: 'READ',
	displayName: 'Get Contact List',
	description: 'Fetch one contact list by id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches one Brevo contact list by its numeric id, returning its name, folder, subscriber and blacklisted counts, and creation date. Use List Contact Lists first if you only know the list by name. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		list_id: Property.Number({
			displayName: 'List ID',
			description: 'Numeric id of the list, from List Contact Lists.',
			required: true,
		}),
	},
	async run(context) {
		const { list_id } = context.propsValue;

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/contacts/lists/${list_id}`,
		});
	},
});
