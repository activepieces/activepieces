import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListMailFoldersActionOutputSchema } from '../output-schemas';

export const outlookListMailFoldersAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_mail_folders',
	classification: 'SEARCH',
	displayName: 'List Mail Folders',
	description: 'Lists the top-level mail folders of the mailbox.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the top-level mail folders with their IDs, display names and item counts, including hidden folders. Use this to resolve a folder ID before moving, copying or listing messages; use List Child Mail Folders to walk deeper into the tree. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of folders to return (1-100).',
			required: false,
			defaultValue: 50,
		}),
	},
	outputSchema: outlookListMailFoldersActionOutputSchema,
	async run(context) {
		const { maxResults } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const top = Math.min(Math.max(maxResults ?? 50, 1), 100);

		try {
			const response: PageCollection = await client
				.api(
					`${prefix}/mailFolders?includeHiddenFolders=true&$select=${outlookAtomicCommon.mailFolderSelect}&$top=${top}`,
				)
				.get();

			const folders = (response.value ?? []) as MailFolder[];
			const nextLink = response['@odata.nextLink'] as string | undefined;

			return {
				folders,
				count: folders.length,
				hasMore: !!nextLink,
				nextLink: nextLink ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Listing the Outlook mail folders' });
		}
	},
});
