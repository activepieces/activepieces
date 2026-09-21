import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookCreateMailFolderActionOutputSchema } from '../output-schemas';

export const outlookCreateMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_mail_folder',
	classification: 'WRITE',
	displayName: 'Create Mail Folder',
	description: 'Creates a mail folder, or returns the existing one with the same name.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a mail folder at the top level or under a parent folder. It first lists the sibling folders and returns the existing folder with created set to false when one already carries the same display name, so no duplicate folder is ever created. Idempotent: repeat calls return the same folder.',
		idempotent: true,
	},
	props: {
		displayName: Property.ShortText({
			displayName: 'Folder Name',
			description: 'Display name of the folder to create.',
			required: true,
		}),
		parentFolderId: Property.ShortText({
			displayName: 'Parent Folder ID',
			description: `Create the folder under this parent. ${outlookAtomicCommon.wellKnownFolderHint} Leave empty to create it at the top level.`,
			required: false,
		}),
	},
	outputSchema: outlookCreateMailFolderActionOutputSchema,
	async run(context) {
		const { displayName, parentFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const collectionPath = parentFolderId
			? `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(parentFolderId)}/childFolders`
			: `${prefix}/mailFolders`;

		try {
			const siblings: PageCollection = await client
				.api(
					`${collectionPath}?includeHiddenFolders=true&$select=${outlookAtomicCommon.mailFolderSelect}&$top=100`,
				)
				.get();

			const existing = ((siblings.value ?? []) as MailFolder[]).find(
				(folder) => (folder.displayName ?? '').toLowerCase() === displayName.trim().toLowerCase(),
			);

			if (existing) {
				return {
					created: false,
					folder: existing,
					folderId: existing.id ?? null,
				};
			}

			const folder: MailFolder = await client.api(collectionPath).post({ displayName });

			return {
				created: true,
				folder,
				folderId: folder?.id ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Creating the Outlook mail folder',
			});
		}
	},
});
