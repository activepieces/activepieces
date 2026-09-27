import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { mailFolderIdDropdown } from '../common/props';
import { findEmailActionOutputSchema } from '../output-schemas';

export const findEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'findEmail',
	classification: 'SEARCH',
	displayName: 'Find Email',
	description: 'Search your mailbox by keywords, sender or subject.',
	audience: 'both',
	aiMetadata: { description: 'Searches the Outlook mailbox for messages matching a full-text query (supports field syntax like from:, subject:, hasAttachments:), optionally scoped to one folder and capped by a max-results count. Use this to locate emails and obtain their message IDs for follow-up actions. Idempotent read-only lookup.', idempotent: true },
	outputSchema: findEmailActionOutputSchema,
	props: {
		searchQuery: Property.ShortText({
			displayName: 'Search Query',
			description: 'Words to find. Narrow with from:, subject: or hasAttachments:true.',
			placeholder: 'from:jane@example.com invoice',
			required: true,
		}),
		folderId: mailFolderIdDropdown({
			displayName: 'Folder',
			description: 'Leave empty to search every folder.',
			required: false,
		}),
		top: Property.Number({
			displayName: 'Max Results',
			description: 'How many emails to return, up to 1000.',
			required: false,
			defaultValue: 25,
			display: 'stepper',
			min: 1,
			max: 1000,
			step: 1,
		}),
	},
	async run(context) {
		const { searchQuery, folderId, top } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);

		const baseUrl = folderId ? `${outlookCommon.mailboxPrefix(context.auth)}/mailFolders/${folderId}/messages` : `${outlookCommon.mailboxPrefix(context.auth)}/messages`;
		const searchParam = `$search="${searchQuery}"`;
		const topParam = top ? `$top=${Math.min(Math.max(top, 1), 1000)}` : '$top=25';

		const queryParams = [searchParam, topParam].filter(Boolean).join('&');
		const url = `${baseUrl}?${queryParams}`;

		const headers: Record<string, string> = {
			ConsistencyLevel: 'eventual',
			Prefer: 'outlook.body-content-type="text"',
		};

		const response: PageCollection = await client.api(url).headers(headers).get();

		const messages = response.value as Message[];
		const nextPageUrl = response['@odata.nextLink'];

		if (searchQuery) {
			messages.sort(
				(a, b) => dayjs(b.receivedDateTime).valueOf() - dayjs(a.receivedDateTime).valueOf(),
			);
		}

		return {
			found: messages.length > 0,
			result: messages,
			hasMore: !!nextPageUrl,
			nextPageUrl: nextPageUrl,
			totalCount: messages.length,
		};
	},
});
