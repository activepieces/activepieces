import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListMailFoldersDeltaActionOutputSchema } from '../output-schemas';

export const outlookListMailFoldersDeltaAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_mail_folders_delta',
	classification: 'SEARCH',
	displayName: 'List Folder Changes (Delta)',
	description: 'Tracks created, renamed and deleted mail folders.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the mail folders created, renamed or removed since a previous delta link, plus a fresh delta link for the next call. Use this to keep a folder tree in sync instead of re-listing it; it pairs with List Message Changes (Delta) for messages. Each change carries a removed flag: when it is true the folder was deleted and only its id and removedReason are meaningful. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		deltaLink: Property.ShortText({
			displayName: 'Delta Link',
			description:
				'The deltaLink returned by a previous run. Leave empty to start a new sync from the current folder tree.',
			required: false,
		}),
	},
	outputSchema: outlookListMailFoldersDeltaActionOutputSchema,
	async run(context) {
		const { deltaLink } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const url = deltaLink ? deltaLink : `${prefix}/mailFolders/delta`;

		try {
			const response: PageCollection = await client
				.api(url)
				.headers({ Prefer: 'odata.maxpagesize=50' })
				.get();

			const changes = ((response.value ?? []) as MailFolder[]).map((change) =>
				outlookAtomicCommon.withDeltaRemoval(change),
			);
			const nextLink = response['@odata.nextLink'] as string | undefined;
			const nextDeltaLink = response['@odata.deltaLink'] as string | undefined;

			return {
				changes,
				count: changes.length,
				hasMore: !!nextLink,
				nextLink: nextLink ?? null,
				deltaLink: nextDeltaLink ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Listing the Outlook mail folder changes',
			});
		}
	},
});
