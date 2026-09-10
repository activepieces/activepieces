import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';

export const importContacts = createAction({
	auth: sendinblueAuth,
	name: 'import_contacts',
	classification: 'WRITE',
	displayName: 'Import Contacts',
	description: 'Start a bulk contact import and return its process id.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Starts a bulk import of contacts into Brevo from CSV text or a file URL and returns a process id immediately. Brevo runs the import in the background, so nothing is imported when this returns — poll Get Import Process with the returned id to find out whether it succeeded and which rows failed. Use this for many contacts at once; for one or two, Create Contact is simpler and gives an immediate answer. Not idempotent: each call starts another import.',
		idempotent: false,
	},
	props: {
		file_url: Property.ShortText({
			displayName: 'File URL',
			description:
				'Public URL of a CSV or TXT file to import. Supply this or File Body, not both.',
			required: false,
		}),
		file_body: Property.LongText({
			displayName: 'File Body',
			description:
				'CSV content to import, starting with a header row, for example: EMAIL;FIRSTNAME. Supply this or File URL, not both.',
			required: false,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Add To Lists',
			description: 'Lists every imported contact is added to.',
		}),
		update_existing_contacts: Property.Checkbox({
			displayName: 'Update Existing Contacts',
			description: 'Update contacts that already exist rather than skipping them.',
			required: false,
			defaultValue: true,
		}),
		empty_contacts_attributes: Property.Checkbox({
			displayName: 'Blank Missing Attributes',
			description:
				'Overwrite attributes that are empty in the file. Leave off to keep existing values.',
			required: false,
		}),
	},
	async run(context) {
		const {
			file_url,
			file_body,
			list_ids,
			update_existing_contacts,
			empty_contacts_attributes,
		} = context.propsValue;

		if (!file_url && !file_body) {
			throw new Error('Supply either File URL or File Body to import contacts.');
		}

		if (file_url && file_body) {
			throw new Error(
				'Supply only one of File URL or File Body, not both — Brevo rejects a request carrying each.',
			);
		}

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const response = await brevoCommon.apiCall<ImportContactsResponse>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/contacts/import',
			body: {
				fileUrl: file_url,
				fileBody: file_body,
				listIds: listIds.length > 0 ? listIds : undefined,
				updateExistingContacts: update_existing_contacts,
				emptyContactsAttributes: empty_contacts_attributes,
			},
		});

		return {
			started: true,
			processId: response.processId,
		};
	},
});

type ImportContactsResponse = {
	processId?: number;
};
