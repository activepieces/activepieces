import { createAction } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import { airparserOutputSchemas } from '../../common';
import { listInboxes } from '../../common/props';

export const listInboxesAiAction = createAction({
	auth: airparserAuth,
	name: 'list_inboxes',
	classification: 'SEARCH',
	displayName: 'List Inboxes',
	description: 'List all Airparser inboxes with their IDs.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns every Airparser inbox in the account as {id, name}. Use it first to find the Inbox ID that the other Airparser tools need. Read-only.',
		idempotent: true,
	},
	outputSchema: airparserOutputSchemas.listInboxes,
	props: {},
	async run(context) {
		return { inboxes: await listInboxes({ apiKey: context.auth.secret_text }) };
	},
});
