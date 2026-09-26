import { createAction } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListFocusedInboxOverridesActionOutputSchema } from '../output-schemas';

export const outlookListFocusedInboxOverridesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_focused_inbox_overrides',
	classification: 'SEARCH',
	displayName: 'List Focused Inbox Overrides',
	description: 'Lists the Focused Inbox sender overrides of the mailbox.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the Focused Inbox overrides that force mail from specific senders into the Focused or Other tab, with the override ID for each sender. Run this first: Update Focused Inbox Override and Delete Focused Inbox Override both need an ID that only this action returns. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	outputSchema: outlookListFocusedInboxOverridesActionOutputSchema,
	async run(context) {
		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const response: PageCollection = await client
				.api(`${prefix}/inferenceClassification/overrides`)
				.get();

			const overrides = (response.value ?? []) as Array<Record<string, unknown>>;

			return {
				overrides,
				count: overrides.length,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Listing the Focused Inbox overrides',
			});
		}
	},
});
