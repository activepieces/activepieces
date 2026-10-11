import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookFullMailFolderActionOutputSchema } from '../output-schemas';

export const outlookUpdateMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_update_mail_folder',
	classification: 'WRITE',
	displayName: 'Rename Mail Folder',
	description: 'Renames a mail folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Renames a mail folder. The display name is the only writable property of a folder, so use Move Mail Folder to change its parent and Create Mail Folder to add a new one. Idempotent: applying the same name again changes nothing.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
		}),
		displayName: Property.ShortText({
			displayName: 'New Folder Name',
			required: true,
		}),
	},
	outputSchema: outlookFullMailFolderActionOutputSchema,
	async run(context) {
		const { folderId, displayName } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}`)
				.patch({ displayName });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Renaming the Outlook mail folder',
			});
		}
	},
});
