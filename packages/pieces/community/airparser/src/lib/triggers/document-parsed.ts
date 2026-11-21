import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { airparserAuth } from '../auth';
import { airparserClient, isRecord, parseBody, pathFor, requireId, stringOrNull } from '../common';
import { inboxIdDropdown } from '../common/props';

export const documentParsedTrigger = createTrigger({
	auth: airparserAuth,
	name: 'document_parsed',
	classification: 'READ',
	displayName: 'Document Parsed',
	description: 'Starts when a document finishes parsing in the selected inbox. Needs a webhook set up in Airparser; may rarely fire twice.',
	aiMetadata: {
		description:
			'Fires when Airparser finishes parsing a document in the selected inbox (the doc.parsed event). The webhook is configured by hand in Airparser. Airparser sends no event ID, so a delivery retry can fire the flow twice for the same doc_id. Uploading to the same inbox from this flow starts it again.',
	},
	type: TriggerStrategy.WEBHOOK,
	props: {
		inboxId: inboxIdDropdown,
		markdown: Property.MarkDown({
			value: `## Airparser Webhook Setup
To use this trigger, set up a webhook in your Airparser account:

1. Log in to Airparser.
2. Open **Integrations** > **Webhooks** in the left sidebar.
3. Enter this URL and select **Document Parsed** as the webhook trigger:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Click Save.

Airparser sends no event ID, so a retried delivery can start the flow twice for the same document. If this flow uploads documents to the same inbox, each upload starts the flow again.`,
		}),
	},
	outputSchema: {
		fields: [
			{ key: 'inbox_id', label: 'Inbox ID' },
			{ key: 'doc_id', label: 'Document ID' },
			{ key: 'event', label: 'Event' },
			{
				key: 'payload',
				label: 'Payload',
				children: [
					{ key: 'filename', label: 'File Name' },
					{
						key: 'parsed',
						label: 'Parsed Data',
						description: 'Fields from the inbox extraction schema, plus created_at added by Airparser. Keys depend on the inbox schema.',
					},
				],
			},
		],
	},
	async onEnable() {
		return;
	},
	async onDisable() {
		return;
	},
	async run(context) {
		const payload = parseBody(context.payload.body);
		if (!isRecord(payload)) {
			return [];
		}
		if (payload['event'] === 'doc.parsed' && payload['inbox_id'] === context.propsValue.inboxId) {
			return [payload];
		}
		return [];
	},
	async test(context) {
		const inboxId = requireId({ value: context.propsValue.inboxId, label: 'Inbox' });
		const apiKey = context.auth.secret_text;
		const list = await airparserClient.call({
			apiKey,
			method: HttpMethod.GET,
			path: `/inboxes${pathFor([inboxId])}/docs`,
			operation: 'list documents',
			query: { page: 1, per_page: TEST_SAMPLE_SIZE, status: ['parsed'] },
		});
		const docs = isRecord(list) && Array.isArray(list['docs']) ? list['docs'].filter(isRecord).slice(0, TEST_SAMPLE_SIZE) : [];
		const items = [];
		for (const doc of docs) {
			const docId = stringOrNull(doc['_id']);
			if (docId === null) {
				continue;
			}
			const full = await airparserClient.call({
				apiKey,
				method: HttpMethod.GET,
				path: `/docs${pathFor([docId])}`,
				operation: 'get document',
			});
			const record = isRecord(full) ? full : {};
			items.push({
				inbox_id: inboxId,
				doc_id: docId,
				event: 'doc.parsed',
				payload: {
					filename: stringOrNull(record['filename']) ?? stringOrNull(record['name']),
					parsed: parsedOf(record),
				},
			});
		}
		return items;
	},
	sampleData: {
		inbox_id: '6846e11bb1abe002cb1ada14',
		doc_id: '6846ee9db1abe002cb1b05ad',
		event: 'doc.parsed',
		payload: {
			filename: 'invoice.pdf',
			parsed: {
				document_title: 'Dummy PDF file',
				created_at: '2026-11-15T12:57:41.714Z',
			},
		},
	},
});

function parsedOf(record: Record<string, unknown>): Record<string, unknown> {
	const json = isRecord(record['json']) ? record['json'] : {};
	const createdAt = stringOrNull(json['created_at']) ?? stringOrNull(record['created_at']);
	return createdAt === null ? json : { ...json, created_at: createdAt };
}

const TEST_SAMPLE_SIZE = 5;
