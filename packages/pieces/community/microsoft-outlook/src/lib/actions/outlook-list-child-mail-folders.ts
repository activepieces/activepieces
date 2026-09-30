import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListChildMailFoldersActionOutputSchema } from '../output-schemas';

export const outlookListChildMailFoldersAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_child_mail_folders',
	classification: 'SEARCH',
	displayName: 'List Child Mail Folders',
	description: 'Lists the sub-folders of one mail folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the direct sub-folders of a given mail folder, including hidden ones, so nested hierarchies can be walked one level at a time. Use List Mail Folders for the top level; a child folder ID works anywhere a folder ID is accepted. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Parent Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
			defaultValue: 'inbox',
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of folders to return (1-100).',
			required: false,
			defaultValue: 50,
		}),
	},
	outputSchema: outlookListChildMailFoldersActionOutputSchema,
	async run(context) {
		const { folderId, maxResults } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const top = Math.min(Math.max(maxResults ?? 50, 1), 100);

		try {
			const response: PageCollection = await client
				.api(
					`${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(
						folderId,
					)}/childFolders?includeHiddenFolders=true&$select=${
						outlookAtomicCommon.mailFolderSelect
					}&$top=${top}`,
				)
				.get();

			const folders = (response.value ?? []) as MailFolder[];
			const nextLink = response['@odata.nextLink'] as string | undefined;

			return {
				parentFolderId: folderId,
				folders,
				count: folders.length,
				hasMore: !!nextLink,
				nextLink: nextLink ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Listing the Outlook child mail folders',
			});
		}
	},
});
