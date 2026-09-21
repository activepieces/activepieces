import { createAction, Property } from '@activepieces/pieces-framework';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookCopyMailFolderActionOutputSchema } from '../output-schemas';

export const outlookCopyMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_copy_mail_folder',
	classification: 'WRITE',
	displayName: 'Copy Mail Folder',
	description: 'Copies a mail folder under another folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Copies a mail folder, with its messages and sub-folders, under a destination folder and returns the new folder. Use Move Mail Folder when the original should not stay in place. Not idempotent: each call creates another copy.',
		idempotent: false,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
		}),
		destinationFolderId: Property.ShortText({
			displayName: 'Destination Folder ID',
			description: `Folder that will contain the copy. ${outlookAtomicCommon.wellKnownFolderHint}`,
			required: true,
		}),
	},
	outputSchema: outlookCopyMailFolderActionOutputSchema,
	async run(context) {
		const { folderId, destinationFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const copied: MailFolder = await client
				.api(`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/copy`)
				.post({ destinationId: destinationFolderId });

			return {
				success: true,
				sourceFolderId: folderId,
				newFolderId: copied?.id ?? null,
				destinationFolderId,
				folder: copied,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Copying the Outlook mail folder',
			});
		}
	},
});
