import {
	createTrigger,
	TriggerStrategy,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof pdfmonkeyAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS }) => {
		const isTest = lastFetchEpochMS === 0;
		const query: Record<string, string | undefined> = {
			'q[status]': 'success',
			'q[updated_since]': isTest ? undefined : String(Math.floor(lastFetchEpochMS / 1000)),
		};
		const documents = isTest
			? (await pdfmonkeyOperations.listDocuments({ auth, status: 'success' })).documents.slice(0, 5)
			: await listSincePoll({ auth, query });
		return documents.map((document) => ({
			epochMilliSeconds: dayjs(String(document['updated_at'] ?? document['created_at'])).valueOf(),
			data: document,
		}));
	},
};

async function listSincePoll({ auth, query }: { auth: unknown; query: Record<string, string | undefined> }) {
	const { items, truncated } = await pdfmonkeyOperations.listAllDocumentCards({ auth, query, maxPages: MAX_POLL_PAGES });
	if (truncated) {
		throw new Error(`More than ${MAX_POLL_PAGES * PAGE_SIZE} documents finished since the last check. The trigger stopped without moving its checkpoint so no document is skipped; it retries on the next poll.`);
	}
	return items;
}

const MAX_POLL_PAGES = 400;
const PAGE_SIZE = 24;

export const documentGeneratedTrigger = createTrigger({
	auth: pdfmonkeyAuth,
	name: 'documentGenerated',
	classification: 'READ',
	displayName: 'Document Generated',
	description: 'Triggers when a document generation completes successfully.',
	aiMetadata: {
		description: 'Fires when a PDFMonkey document finishes generating with a success status. Each event represents one completed document, carrying its download URL, filename, template, and metadata. Polls for documents updated since the last check.',
	},
	outputSchema: pdfmonkeySchemas.document,
	props: {},
	sampleData: {
		id: '472b1c2e-6a4b-4f04-ad78-0aa040fd9f09',
		app_id: '9dd42e52-2c1f-4fde-adf1-50c12afb612e',
		created_at: '2026-10-15T13:54:20.177+02:00',
		updated_at: '2026-10-15T13:54:22.021+02:00',
		document_template_id: '07fdc6bb-8eff-4d1a-9cc6-9083775905df',
		document_template_identifier: 'Invoice',
		status: 'success',
		output_type: 'pdf',
		filename: 'Invoice INV-42.pdf',
		meta: '{"ref":"INV-42","_filename":"Invoice INV-42.pdf"}',
		download_url: 'https://pdfmonkey-store.s3.eu-west-3.amazonaws.com/production/backend/document/472b1c2e-6a4b-4f04-ad78-0aa040fd9f09/Invoice%20INV-42.pdf?X-Amz-Expires=3600',
		preview_url: 'https://preview.pdfmonkey.io/pdf/web/viewer.html?file=https%3A%2F%2Fpreview.pdfmonkey.io%2Fdocument-render%2F472b1c2e-6a4b-4f04-ad78-0aa040fd9f09',
		public_share_link: null,
		failure_cause: null,
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},

	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
