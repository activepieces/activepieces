import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import { airparserClient, airparserOutputSchemas, pathFor, requireId, toInbox } from '../../common';

export const getInboxAiAction = createAction({
	auth: airparserAuth,
	name: 'get_inbox',
	classification: 'READ',
	displayName: 'Get Inbox',
	description: 'Get one inbox with its extraction schema.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns one Airparser inbox by Inbox ID, including its parsing engine and current extraction schema (the fields Airparser extracts). Use it to learn which fields parsed documents will contain. Read-only.',
		idempotent: true,
	},
	outputSchema: airparserOutputSchemas.inbox,
	props: {
		inboxId: Property.ShortText({ displayName: 'Inbox ID', description: 'The inbox ID, from List Inboxes.', required: true }),
	},
	async run(context) {
		const inboxId = requireId({ value: context.propsValue.inboxId, label: 'Inbox ID' });
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/inboxes${pathFor([inboxId])}`,
			operation: 'get inbox',
		});
		return toInbox({ raw: response, fallbackId: inboxId });
	},
});
