import { createAction, Property } from '@activepieces/pieces-framework';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMoveMailFolderActionOutputSchema } from '../output-schemas';

export const outlookMoveMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_move_mail_folder',
	classification: 'WRITE',
	displayName: 'Move Mail Folder',
	description: 'Moves a mail folder under another folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reparents a mail folder, moving it with its messages and sub-folders under a different destination folder. Use Copy Mail Folder to duplicate instead of relocating, and Rename Mail Folder to change only its name. The move issues the folder a new ID: carry newFolderId forward into later steps, not the folderId that was passed in. Not idempotent: once moved, the same call repeated against the old parent no longer applies.',
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
			description: `New parent folder. ${outlookAtomicCommon.wellKnownFolderHint}`,
			required: true,
		}),
	},
	outputSchema: outlookMoveMailFolderActionOutputSchema,
	async run(context) {
		const { folderId, destinationFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const moved: MailFolder = await client
				.api(`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/move`)
				.post({ destinationId: destinationFolderId });

			return {
				success: true,
				folderId,
				newFolderId: moved?.id ?? null,
				destinationFolderId,
				folder: moved,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Moving the Outlook mail folder',
			});
		}
	},
});
