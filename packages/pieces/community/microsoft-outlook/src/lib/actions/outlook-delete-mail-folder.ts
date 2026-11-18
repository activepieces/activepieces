import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDeleteMailFolderActionOutputSchema } from '../output-schemas';

export const outlookDeleteMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_delete_mail_folder',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Mail Folder',
	description: 'Deletes a mail folder and everything inside it.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes a mail folder together with every message and sub-folder it contains. Move messages out with Batch Move Messages first if they must be kept. Not idempotent: repeating the call with the same ID fails once the folder is gone.',
		idempotent: false,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: `${outlookAtomicCommon.wellKnownFolderHint} Well-known system folders cannot be deleted.`,
			required: true,
		}),
	},
	outputSchema: outlookDeleteMailFolderActionOutputSchema,
	async run(context) {
		const { folderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}`)
				.delete();

			return {
				success: true,
				message: 'Mail folder deleted.',
				folderId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Deleting the Outlook mail folder',
			});
		}
	},
});
