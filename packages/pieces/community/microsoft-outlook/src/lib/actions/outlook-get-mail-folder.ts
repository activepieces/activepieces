import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMailFolderActionOutputSchema } from '../output-schemas';

export const outlookGetMailFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_mail_folder',
	classification: 'READ',
	displayName: 'Get Mail Folder',
	description: 'Reads one mail folder by ID or well-known name.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads a single mail folder and returns its display name, parent, child count and unread and total item counts. Accepts either an opaque folder ID or a well-known name such as inbox or drafts, which makes it the cheapest way to resolve a standard folder ID. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
			defaultValue: 'inbox',
		}),
	},
	outputSchema: outlookMailFolderActionOutputSchema,
	async run(context) {
		const { folderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(
					`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}?$select=${
						outlookAtomicCommon.mailFolderSelect
					}`,
				)
				.get();
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Reading the Outlook mail folder' });
		}
	},
});
