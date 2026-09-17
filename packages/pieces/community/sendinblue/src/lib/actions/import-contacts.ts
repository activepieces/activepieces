import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { importContactsActionOutputSchema } from '../output-schemas';

export const importContacts = createAction({
	auth: sendinblueAuth,
	name: 'import_contacts',
	outputSchema: importContactsActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Import Contacts',
	description: 'Bulk import contacts into Brevo from a file URL or an inline list of rows.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Submits a bulk contact import job to Brevo, from a public file URL or an inline list of email/attribute rows, optionally into an existing or newly created list. This piece has no "get import status" action, so track completion via the Notify URL webhook or the Brevo dashboard. Not idempotent — each call submits a new background import job, even with identical input.',
		idempotent: false,
	},
	props: {
		file_url: Property.ShortText({
			displayName: 'File URL',
			description: 'Public URL of a .txt, .csv, or .json file containing the contacts to import. Mutually exclusive with Inline Contacts.',
			required: false,
		}),
		json_body: Property.Array({
			displayName: 'Inline Contacts',
			description: 'Contact rows to import directly, without a file. Mutually exclusive with File URL.',
			required: false,
			properties: {
				email: Property.ShortText({
					displayName: 'Email',
					required: true,
				}),
				attributes: Property.Json({
					displayName: 'Attributes',
					description: 'Attribute names and values for this contact, for eg: {"FNAME":"Elly"}.',
					required: false,
				}),
			},
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Lists',
			description: 'Existing lists to import into.',
		}),
		new_list_name: Property.ShortText({
			displayName: 'New List Name',
			description: 'Creates a new list with this name and imports into it. Requires New List Folder ID.',
			required: false,
		}),
		new_list_folder_id: Property.Number({
			displayName: 'New List Folder ID',
			description: 'Folder to create the new list in. Requires New List Name.',
			required: false,
		}),
		notify_url: Property.ShortText({
			displayName: 'Notify URL',
			description: 'A webhook URL Brevo calls once the import finishes.',
			required: false,
		}),
		email_blacklist: Property.Checkbox({
			displayName: 'Blacklist Imported Emails',
			required: false,
			defaultValue: false,
		}),
		sms_blacklist: Property.Checkbox({
			displayName: 'Blacklist Imported SMS Numbers',
			required: false,
			defaultValue: false,
		}),
		update_existing_contacts: Property.Checkbox({
			displayName: 'Update Existing Contacts',
			required: false,
			defaultValue: true,
		}),
		empty_contacts_attributes: Property.Checkbox({
			displayName: 'Reset Attributes on Existing Contacts',
			description: 'Blank out attributes not present in the import for contacts that already exist.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const {
			file_url,
			json_body,
			list_ids,
			new_list_name,
			new_list_folder_id,
			notify_url,
			email_blacklist,
			sms_blacklist,
			update_existing_contacts,
			empty_contacts_attributes,
		} = context.propsValue;

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const jsonBody = (json_body ?? [])
			.map((row) => toImportRow(row))
			.filter((row): row is ImportRow => row !== null);

		if (isNil(file_url) && jsonBody.length === 0) {
			throw new Error(
				'Provide either a File URL or at least one inline contact row with a valid email.',
			);
		}

		const newList =
			new_list_name && !isNil(new_list_folder_id)
				? { listName: new_list_name, folderId: new_list_folder_id }
				: undefined;

		if (listIds.length === 0 && isNil(newList)) {
			throw new Error(
				'Provide at least one existing list in Lists, or both New List Name and New List Folder ID, to import into.',
			);
		}

		const body = {
			fileUrl: file_url,
			jsonBody: jsonBody.length > 0 ? jsonBody : undefined,
			listIds: listIds.length > 0 ? listIds : undefined,
			newList,
			notifyUrl: notify_url,
			emailBlacklist: email_blacklist,
			smsBlacklist: sms_blacklist,
			updateExistingContacts: update_existing_contacts,
			emptyContactsAttributes: empty_contacts_attributes,
		};

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/contacts/import',
			body,
		});
	},
});

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toImportRow(row: unknown): ImportRow | null {
	if (!isRecord(row)) {
		return null;
	}

	const email = row['email'];
	if (typeof email !== 'string' || email.trim().length === 0) {
		return null;
	}

	const attributes = row['attributes'];

	return {
		email,
		attributes: isRecord(attributes) ? attributes : undefined,
	};
}

type ImportRow = {
	email: string;
	attributes?: Record<string, unknown>;
};
