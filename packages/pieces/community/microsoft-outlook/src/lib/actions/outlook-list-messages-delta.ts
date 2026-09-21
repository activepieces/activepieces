import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListMessagesDeltaActionOutputSchema } from '../output-schemas';

export const outlookListMessagesDeltaAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_messages_delta',
	classification: 'SEARCH',
	displayName: 'List Message Changes (Delta)',
	description: 'Tracks created, updated and deleted messages in a folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the messages added, changed or removed in one mail folder since a previous delta link, plus a fresh delta link for the next call. Use this for incremental sync instead of re-listing a folder; a first call without a delta link returns the current contents. Delta payloads omit message bodies and attachments, so follow up with Get Message for full content. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: `Folder to track. ${outlookAtomicCommon.wellKnownFolderHint}`,
			required: true,
			defaultValue: 'inbox',
		}),
		deltaLink: Property.ShortText({
			displayName: 'Delta Link',
			description:
				'The deltaLink returned by a previous run. Leave empty to start a new sync from the current folder state.',
			required: false,
		}),
	},
	outputSchema: outlookListMessagesDeltaActionOutputSchema,
	async run(context) {
		const { folderId, deltaLink } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		const url = deltaLink
			? deltaLink
			: `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/messages/delta`;

		try {
			const response: PageCollection = await client
				.api(url)
				.headers({ Prefer: 'odata.maxpagesize=50' })
				.get();

			const changes = (response.value ?? []) as Message[];
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
				operation: 'Listing Outlook message changes',
			});
		}
	},
});
