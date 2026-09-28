import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { createContactListActionOutputSchema } from '../output-schemas';

export const createContactList = createAction({
	auth: sendinblueAuth,
	name: 'create_contact_list',
	outputSchema: createContactListActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Contact List',
	description: 'Create a new contact list in Brevo.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Brevo contact list inside a folder and returns its numeric id. Use List Contact Lists first to find a folder id if you do not already know one. Not idempotent — calling this again with the same name creates another list, Brevo does not dedupe by name.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		folder_id: Property.Number({
			displayName: 'Folder ID',
			description:
				"ID of the folder to create this list in. Use List Contact Lists first if you don't know a folder id; Brevo's default folder for a new account is usually id 1, but this varies.",
			required: true,
		}),
	},
	async run(context) {
		const { name, folder_id } = context.propsValue;

		const list = await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/contacts/lists',
			body: {
				name,
				folderId: folder_id,
			},
		});

		return list;
	},
});
