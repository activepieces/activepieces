import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookSearchMessagesActionOutputSchema } from '../output-schemas';

export const outlookSearchMessagesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_search_messages',
	classification: 'SEARCH',
	displayName: 'Search Messages',
	description: 'Searches messages with a full-text query.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Runs a full-text Outlook search (KQL terms such as from:jane@contoso.com, subject:invoice or hasAttachments:true), optionally inside one folder, and returns matching messages newest first. Pick this when you have keywords; use List Messages when you need an exact OData filter or paging. Search cannot be combined with filters or server-side sorting, and is unreliable on personal Microsoft accounts. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		searchQuery: Property.ShortText({
			displayName: 'Search Query',
			description:
				'Keywords or KQL terms to match, for example: from:john@example.com, subject:urgent, hasAttachments:true.',
			required: true,
		}),
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: `Search inside one folder only. ${outlookAtomicCommon.wellKnownFolderHint} Leave empty to search the whole mailbox.`,
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of results to return (1-1000).',
			required: false,
			defaultValue: 25,
		}),
	},
	outputSchema: outlookSearchMessagesActionOutputSchema,
	async run(context) {
		const { searchQuery, folderId, maxResults } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const basePath = folderId
			? `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/messages`
			: `${prefix}/messages`;

		const top = Math.min(Math.max(maxResults ?? 25, 1), 1000);
		const url = `${basePath}?$search="${searchQuery}"&$top=${top}`;

		try {
			const response: PageCollection = await client
				.api(url)
				.headers({
					ConsistencyLevel: 'eventual',
					...outlookAtomicCommon.textBodyHeaders,
				})
				.get();

			const messages = (response.value ?? []) as Message[];
			messages.sort(
				(first, second) =>
					dayjs(second.receivedDateTime).valueOf() - dayjs(first.receivedDateTime).valueOf(),
			);

			const nextLink = response['@odata.nextLink'] as string | undefined;

			return {
				found: messages.length > 0,
				messages,
				count: messages.length,
				hasMore: !!nextLink,
				nextLink: nextLink ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Searching Outlook messages' });
		}
	},
});
