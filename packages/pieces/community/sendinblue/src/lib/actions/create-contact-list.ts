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
	description: 'Create a contact list inside a folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new Brevo contact list and returns its id. A list must live inside a folder, so Folder ID is required — existing lists returned by List Contact Lists carry the folder id they belong to. Creating a list does not add anyone to it; use Create Contact or Update Contact with the new id for that. Not idempotent: calling twice with the same name creates two lists.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Name of the new list.',
			required: true,
		}),
		folder_id: Property.Number({
			displayName: 'Folder ID',
			description:
				'Folder the list is created in. Existing lists report their folder id.',
			required: true,
		}),
	},
	async run(context) {
		const { name, folder_id } = context.propsValue;

		const created = await brevoCommon.apiCall<CreateListResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/contacts/lists',
			body: { name, folderId: folder_id },
		});

		return { id: created?.id, name, folderId: folder_id };
	},
});

type CreateListResponse = {
	id?: number;
};
