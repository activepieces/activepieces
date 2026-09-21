import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListMessagesActionOutputSchema } from '../output-schemas';

export const outlookListMessagesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_messages',
	classification: 'SEARCH',
	displayName: 'List Messages',
	description: 'Lists messages from the mailbox or a single mail folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Enumerates Outlook messages, optionally scoped to one mail folder and narrowed by an OData $filter expression, and returns their IDs and headers. Use this to discover message IDs for other actions; use Search Messages instead when you only have free-text keywords. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: `Limit the listing to one folder. ${outlookAtomicCommon.wellKnownFolderHint} Leave empty to list the whole mailbox.`,
			required: false,
		}),
		filter: Property.ShortText({
			displayName: 'Filter',
			description:
				'Optional OData $filter expression, for example: isRead eq false, or receivedDateTime ge 2024-01-01T00:00:00Z.',
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of messages to return (1-100).',
			required: false,
			defaultValue: 25,
		}),
		skip: Property.Number({
			displayName: 'Skip',
			description: 'Number of messages to skip before returning results, for paging.',
			required: false,
		}),
	},
	outputSchema: outlookListMessagesActionOutputSchema,
	async run(context) {
		const { folderId, filter, maxResults, skip } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const basePath = folderId
			? `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folderId)}/messages`
			: `${prefix}/messages`;

		const top = Math.min(Math.max(maxResults ?? 25, 1), 100);
		const queryParams = [`$select=${outlookAtomicCommon.messageSelect}`, `$top=${top}`];

		if (filter) {
			queryParams.push(`$filter=${encodeURIComponent(filter)}`);
		} else {
			queryParams.push('$orderby=receivedDateTime%20desc');
		}

		if (skip !== undefined && skip > 0) {
			queryParams.push(`$skip=${Math.floor(skip)}`);
		}

		try {
			const response: PageCollection = await client
				.api(`${basePath}?${queryParams.join('&')}`)
				.headers(outlookAtomicCommon.textBodyHeaders)
				.get();

			const messages = (response.value ?? []) as Message[];
			const nextLink = response['@odata.nextLink'] as string | undefined;

			return {
				messages,
				count: messages.length,
				hasMore: !!nextLink,
				nextLink: nextLink ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Listing Outlook messages' });
		}
	},
});
